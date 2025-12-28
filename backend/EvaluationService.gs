/**
 * Evaluation Service
 * Handles evaluation CRUD operations with row-level security
 */

/**
 * Get all evaluations accessible to current user
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Request payload (optional filters)
 * @returns {Object} Success or error response
 */
function handleGetEvaluations(currentUser, payload) {
  try {
    const sheet = getSheet(SHEET_NAMES.EVALUATIONS);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return successResponse([]); // No evaluations
    }

    const colMap = COLUMN_MAPS.EVALUATIONS;
    const evaluations = [];

    // Apply row-level security
    for (let i = 1; i < data.length; i++) {
      const evaluation = rowToEvaluation(colMap, data[i]);

      if (isAdmin(currentUser)) {
        // Admins see all
        evaluations.push(evaluation);
      } else if (evaluation.employeeId === currentUser.id) {
        // Users see their own
        evaluations.push(evaluation);
      } else if (isManager(currentUser)) {
        // Managers see direct reports only
        const directReportIds = getDirectReportIds(currentUser.id);
        if (directReportIds.includes(evaluation.employeeId)) {
          evaluations.push(evaluation);
        }
      }
    }

    // Enrich with ratings and goals
    const enrichedEvaluations = evaluations.map(e => enrichEvaluation(e));

    // Apply optional filters
    let filteredEvaluations = enrichedEvaluations;

    if (payload.cycleId) {
      filteredEvaluations = filteredEvaluations.filter(e => e.cycleId === payload.cycleId);
    }

    if (payload.status) {
      filteredEvaluations = filteredEvaluations.filter(e => e.status === payload.status);
    }

    if (payload.type) {
      filteredEvaluations = filteredEvaluations.filter(e => e.type === payload.type);
    }

    return successResponse(filteredEvaluations);

  } catch (error) {
    Logger.log('Error in handleGetEvaluations: ' + error.message);
    return errorResponse('Failed to retrieve evaluations', 'GET_EVALUATIONS_ERROR');
  }
}

/**
 * Get a single evaluation by ID
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Request payload with evaluationId
 * @returns {Object} Success or error response
 */
function handleGetEvaluation(currentUser, payload) {
  const evaluationId = payload.evaluationId;

  if (!evaluationId) {
    return errorResponse('Missing evaluationId parameter', 'MISSING_PARAMETER');
  }

  try {
    const sheet = getSheet(SHEET_NAMES.EVALUATIONS);
    const rowIndex = findRowById(sheet, COLUMN_MAPS.EVALUATIONS.id, evaluationId);

    if (rowIndex === -1) {
      return errorResponse('Evaluation not found', 'EVALUATION_NOT_FOUND');
    }

    const data = sheet.getDataRange().getValues();
    const evaluation = rowToEvaluation(COLUMN_MAPS.EVALUATIONS, data[rowIndex - 1]);

    // Authorization check
    if (!canAccessEvaluation(currentUser, evaluation)) {
      return errorResponse('Unauthorized: Cannot access this evaluation', 'UNAUTHORIZED');
    }

    // Enrich with ratings and goals
    const enrichedEvaluation = enrichEvaluation(evaluation);

    return successResponse(enrichedEvaluation);

  } catch (error) {
    Logger.log('Error in handleGetEvaluation: ' + error.message);
    return errorResponse('Failed to retrieve evaluation', 'GET_EVALUATION_ERROR');
  }
}

/**
 * Enrich evaluation with ratings and goals from related tables
 * @param {Object} evaluation - Base evaluation object
 * @returns {Object} Enriched evaluation with nested arrays
 */
function enrichEvaluation(evaluation) {
  // Get all ratings for this evaluation
  const ratingsSheet = getSheet(SHEET_NAMES.RATINGS);
  const ratingsData = ratingsSheet.getDataRange().getValues();
  const ratingsColMap = COLUMN_MAPS.RATINGS;

  const selfRatings = [];
  const peerRatings = [];
  const managerRatings = [];

  for (let i = 1; i < ratingsData.length; i++) {
    const rating = rowToRating(ratingsColMap, ratingsData[i]);

    if (rating.evaluationId === evaluation.id) {
      const ratingObj = {
        competencyId: rating.competencyId,
        score: rating.score,
        comments: rating.comments
      };

      switch(rating.ratingType) {
        case RATING_TYPES.SELF:
          selfRatings.push(ratingObj);
          break;
        case RATING_TYPES.PEER:
          peerRatings.push(ratingObj);
          break;
        case RATING_TYPES.MANAGER:
          managerRatings.push(ratingObj);
          break;
      }
    }
  }

  // Get all goals for this evaluation
  const goalsSheet = getSheet(SHEET_NAMES.GOALS);
  const goalsData = goalsSheet.getDataRange().getValues();
  const goalsColMap = COLUMN_MAPS.GOALS;

  const goals = [];
  for (let i = 1; i < goalsData.length; i++) {
    const goal = rowToGoal(goalsColMap, goalsData[i]);

    if (goal.evaluationId === evaluation.id) {
      goals.push({
        id: goal.id,
        description: goal.description,
        status: goal.status,
        achievements: goal.achievements,
        challenges: goal.challenges
      });
    }
  }

  return {
    ...evaluation,
    selfRatings,
    peerRatings,
    managerRatings,
    goals
  };
}

/**
 * Create a new evaluation
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Request payload
 * @returns {Object} Success or error response
 */
function handleCreateEvaluation(currentUser, payload) {
  const { employeeId, cycleId, type } = payload;

  if (!employeeId || !cycleId || !type) {
    return errorResponse('Missing required fields: employeeId, cycleId, type', 'MISSING_PARAMETERS');
  }

  // Authorization check
  if (!canCreateEvaluation(currentUser, employeeId)) {
    return errorResponse('Unauthorized: Cannot create evaluation for this user', 'UNAUTHORIZED');
  }

  try {
    const evaluationId = generateId('e');
    const now = getCurrentTimestamp();

    const rowData = [
      evaluationId,                     // id
      employeeId,                       // employeeId
      cycleId,                          // cycleId
      type,                             // type
      EVALUATION_STATUSES.DRAFT,        // status
      '',                               // overallSummary
      now,                              // createdAt
      now                               // updatedAt
    ];

    appendRow(SHEET_NAMES.EVALUATIONS, rowData);

    const newEvaluation = {
      id: evaluationId,
      employeeId,
      cycleId,
      type,
      status: EVALUATION_STATUSES.DRAFT,
      overallSummary: null,
      selfRatings: [],
      peerRatings: [],
      managerRatings: [],
      goals: [],
      createdAt: now,
      updatedAt: now
    };

    return successResponse(newEvaluation);

  } catch (error) {
    Logger.log('Error in handleCreateEvaluation: ' + error.message);
    return errorResponse('Failed to create evaluation', 'CREATE_EVALUATION_ERROR');
  }
}

/**
 * Update evaluation status
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Request payload with evaluationId and newStatus
 * @returns {Object} Success or error response
 */
function handleUpdateEvaluationStatus(currentUser, payload) {
  const { evaluationId, newStatus } = payload;

  if (!evaluationId || !newStatus) {
    return errorResponse('Missing required fields: evaluationId, newStatus', 'MISSING_PARAMETERS');
  }

  try {
    const sheet = getSheet(SHEET_NAMES.EVALUATIONS);
    const rowIndex = findRowById(sheet, COLUMN_MAPS.EVALUATIONS.id, evaluationId);

    if (rowIndex === -1) {
      return errorResponse('Evaluation not found', 'EVALUATION_NOT_FOUND');
    }

    const data = sheet.getDataRange().getValues();
    const evaluation = rowToEvaluation(COLUMN_MAPS.EVALUATIONS, data[rowIndex - 1]);

    // Authorization check
    if (!canTransitionStatus(currentUser, evaluation)) {
      return errorResponse('Unauthorized: Cannot update status for this evaluation', 'UNAUTHORIZED');
    }

    // Verify status transition is valid
    const expectedNextStatus = getNextStatus(evaluation.status, evaluation.type);
    if (newStatus !== expectedNextStatus && !isAdmin(currentUser)) {
      return errorResponse(`Invalid status transition. Expected: ${expectedNextStatus}`, 'INVALID_STATUS');
    }

    // Update the row
    const now = getCurrentTimestamp();
    const updatedRow = data[rowIndex - 1];
    updatedRow[COLUMN_MAPS.EVALUATIONS.status] = newStatus;
    updatedRow[COLUMN_MAPS.EVALUATIONS.updatedAt] = now;

    updateRow(SHEET_NAMES.EVALUATIONS, rowIndex, updatedRow);

    const updatedEvaluation = enrichEvaluation({
      ...evaluation,
      status: newStatus,
      updatedAt: now
    });

    return successResponse(updatedEvaluation);

  } catch (error) {
    Logger.log('Error in handleUpdateEvaluationStatus: ' + error.message);
    return errorResponse('Failed to update evaluation status', 'UPDATE_STATUS_ERROR');
  }
}

/**
 * Pull back evaluation (revert status)
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Request payload with evaluationId
 * @returns {Object} Success or error response
 */
function handlePullBackEvaluation(currentUser, payload) {
  const { evaluationId } = payload;

  if (!evaluationId) {
    return errorResponse('Missing evaluationId parameter', 'MISSING_PARAMETER');
  }

  try {
    const sheet = getSheet(SHEET_NAMES.EVALUATIONS);
    const rowIndex = findRowById(sheet, COLUMN_MAPS.EVALUATIONS.id, evaluationId);

    if (rowIndex === -1) {
      return errorResponse('Evaluation not found', 'EVALUATION_NOT_FOUND');
    }

    const data = sheet.getDataRange().getValues();
    const evaluation = rowToEvaluation(COLUMN_MAPS.EVALUATIONS, data[rowIndex - 1]);

    // Authorization check
    if (!canPullBackEvaluation(currentUser, evaluation)) {
      return errorResponse('Unauthorized: Cannot pull back this evaluation', 'UNAUTHORIZED');
    }

    // Revert to Draft status
    const now = getCurrentTimestamp();
    const updatedRow = data[rowIndex - 1];
    updatedRow[COLUMN_MAPS.EVALUATIONS.status] = EVALUATION_STATUSES.DRAFT;
    updatedRow[COLUMN_MAPS.EVALUATIONS.updatedAt] = now;

    updateRow(SHEET_NAMES.EVALUATIONS, rowIndex, updatedRow);

    const updatedEvaluation = enrichEvaluation({
      ...evaluation,
      status: EVALUATION_STATUSES.DRAFT,
      updatedAt: now
    });

    return successResponse(updatedEvaluation);

  } catch (error) {
    Logger.log('Error in handlePullBackEvaluation: ' + error.message);
    return errorResponse('Failed to pull back evaluation', 'PULL_BACK_ERROR');
  }
}
