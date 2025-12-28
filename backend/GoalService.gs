/**
 * Goal Service
 * Handles goal CRUD operations
 */

/**
 * Save goals for an evaluation
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Request payload with evaluationId and goals array
 * @returns {Object} Success or error response
 */
function handleSaveGoals(currentUser, payload) {
  const { evaluationId, goals } = payload;

  if (!evaluationId || !goals) {
    return errorResponse('Missing required fields: evaluationId, goals', 'MISSING_PARAMETERS');
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

    // Authorization check
    if (!canModifyEvaluation(currentUser, evaluation, 'GOALS')) {
      return errorResponse('Unauthorized: Cannot save goals for this evaluation', 'UNAUTHORIZED');
    }

    // Delete existing goals for this evaluation
    const goalsSheet = getSheet(SHEET_NAMES.GOALS);
    const goalsData = goalsSheet.getDataRange().getValues();
    const goalsColMap = COLUMN_MAPS.GOALS;

    // Delete from bottom to top to avoid index shifting
    for (let i = goalsData.length - 1; i >= 1; i--) {
      const goal = rowToGoal(goalsColMap, goalsData[i]);
      if (goal.evaluationId === evaluationId) {
        deleteRow(SHEET_NAMES.GOALS, i + 1);
      }
    }

    // Insert new goals
    const now = getCurrentTimestamp();
    for (const goal of goals) {
      const goalId = goal.id || generateId('g');
      const rowData = [
        goalId,                       // id
        evaluationId,                 // evaluationId
        goal.description || '',       // description
        goal.status || GOAL_STATUSES.NOT_STARTED, // status
        goal.achievements || '',      // achievements
        goal.challenges || '',        // challenges
        now,                          // createdAt
        now                           // updatedAt
      ];

      appendRow(SHEET_NAMES.GOALS, rowData);
    }

    // Update evaluation timestamp
    const updatedEvalRow = evalData[evalRowIndex - 1];
    updatedEvalRow[COLUMN_MAPS.EVALUATIONS.updatedAt] = now;
    updateRow(SHEET_NAMES.EVALUATIONS, evalRowIndex, updatedEvalRow);

    // Return enriched evaluation
    const enrichedEvaluation = enrichEvaluation({
      ...evaluation,
      updatedAt: now
    });

    return successResponse(enrichedEvaluation);

  } catch (error) {
    Logger.log('Error in handleSaveGoals: ' + error.message);
    return errorResponse('Failed to save goals', 'SAVE_GOALS_ERROR');
  }
}
