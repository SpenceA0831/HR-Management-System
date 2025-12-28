/**
 * Cycle Service
 * Handles evaluation cycle operations
 */

/**
 * Get all evaluation cycles
 * @param {Object} currentUser - The authenticated user
 * @returns {Object} Success or error response
 */
function handleGetCycles(currentUser) {
  try {
    const cycles = getSheetData(
      SHEET_NAMES.EVALUATION_CYCLES,
      COLUMN_MAPS.EVALUATION_CYCLES,
      rowToCycle
    );

    return successResponse(cycles);

  } catch (error) {
    Logger.log('Error in handleGetCycles: ' + error.message);
    return errorResponse('Failed to retrieve cycles', 'GET_CYCLES_ERROR');
  }
}

/**
 * Get the active evaluation cycle
 * @param {Object} currentUser - The authenticated user
 * @returns {Object} Success or error response
 */
function handleGetActiveCycle(currentUser) {
  try {
    const cycles = getSheetData(
      SHEET_NAMES.EVALUATION_CYCLES,
      COLUMN_MAPS.EVALUATION_CYCLES,
      rowToCycle
    );

    // Find the first active cycle
    const activeCycle = cycles.find(c => c.status === 'Active');

    if (!activeCycle) {
      return errorResponse('No active cycle found', 'NO_ACTIVE_CYCLE');
    }

    return successResponse(activeCycle);

  } catch (error) {
    Logger.log('Error in handleGetActiveCycle: ' + error.message);
    return errorResponse('Failed to retrieve active cycle', 'GET_ACTIVE_CYCLE_ERROR');
  }
}
