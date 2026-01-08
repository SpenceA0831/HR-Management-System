/**
 * Rating Service
 * Handles saving and updating ratings with type-based authorization
 */

/**
 * Save ratings for an evaluation
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Request payload with evaluationId, ratingType, ratings, submit
 * @returns {Object} Success or error response
 */
function handleSaveRatings(currentUser, payload) {
  const { evaluationId, ratingType, ratings, submit } = payload;

  if (!evaluationId || !ratingType || !ratings) {
    return errorResponse('Missing required fields: evaluationId, ratingType, ratings', 'MISSING_PARAMETERS');
  }

  // Validate rating type
  if (!Object.values(RATING_TYPES).includes(ratingType)) {
    return errorResponse('Invalid rating type', 'INVALID_RATING_TYPE');
  }

  try {
    // Get the evaluation
    const evalSheet = getSheet(SHEET_NAMES.EVALUATIONS);
    const evalRowIndex = findRowById(evalSheet, COLUMN_MAPS.EVALUATIONS.id, evaluationId);

    if (evalRowIndex === -1) {
      return errorResponse('Evaluation not found', 'EVALUATION_NOT_FOUND');
    }

    const evalData = evalSheet.getDataRange().getValues();
    const evaluation = rowToEvaluation(COLUMN_MAPS.EVALUATIONS, evalData[evalRowIndex - 1]);

    // Authorization check based on rating type
    const modificationType = ratingType === RATING_TYPES.SELF ? 'SELF_RATING' :
                            ratingType === RATING_TYPES.MANAGER ? 'MANAGER_RATING' :
                            'PEER_RATING';

    if (!canModifyEvaluation(currentUser, evaluation, modificationType)) {
      return errorResponse('Unauthorized: Cannot save ' + ratingType.toLowerCase() + ' ratings for this evaluation', 'UNAUTHORIZED');
    }

    // Delete existing ratings of this type for this evaluation
    const ratingsSheet = getSheet(SHEET_NAMES.RATINGS);
    const ratingsData = ratingsSheet.getDataRange().getValues();
    const ratingsColMap = COLUMN_MAPS.RATINGS;

    // Find and delete old ratings (from bottom to top to avoid index shifting)
    for (let i = ratingsData.length - 1; i >= 1; i--) {
      const rating = rowToRating(ratingsColMap, ratingsData[i]);
      if (rating.evaluationId === evaluationId && rating.ratingType === ratingType) {
        // For peer ratings, also check reviewer
        if (ratingType === RATING_TYPES.PEER && rating.reviewerId !== currentUser.id) {
          continue; // Don't delete other reviewers' ratings
        }
        deleteRow(SHEET_NAMES.RATINGS, i + 1);
      }
    }

    // Insert new ratings
    const now = getCurrentTimestamp();
    for (const rating of ratings) {
      const ratingId = generateId('r');
      const rowData = [
        ratingId,                     // id
        evaluationId,                 // evaluationId
        ratingType,                   // ratingType
        rating.competencyId,          // competencyId
        rating.score,                 // score
        rating.comments || '',        // comments
        ratingType === RATING_TYPES.PEER ? currentUser.id : '', // reviewerId
        now,                          // createdAt
        now                           // updatedAt
      ];

      appendRow(SHEET_NAMES.RATINGS, rowData);
    }

    // If submit flag is true and this is a self-assessment, update status
    if (submit && ratingType === RATING_TYPES.SELF) {
      const nextStatus = getNextStatus(evaluation.status, evaluation.type);
      if (nextStatus) {
        const updatedEvalRow = evalData[evalRowIndex - 1];
        updatedEvalRow[COLUMN_MAPS.EVALUATIONS.status] = nextStatus;
        updatedEvalRow[COLUMN_MAPS.EVALUATIONS.updatedAt] = now;
        updateRow(SHEET_NAMES.EVALUATIONS, evalRowIndex, updatedEvalRow);
        evaluation.status = nextStatus;
      }
    }

    // Return enriched evaluation
    const enrichedEvaluation = enrichEvaluation({
      ...evaluation,
      updatedAt: now
    });

    return successResponse(enrichedEvaluation);

  } catch (error) {
    Logger.log('Error in handleSaveRatings: ' + error.message);
    return errorResponse('Failed to save ratings', 'SAVE_RATINGS_ERROR');
  }
}
