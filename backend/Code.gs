/**
 * Main entry point for HR Management System (Google Apps Script Web App)
 * Handles routing for both PTO and Evaluations modules
 */

/**
 * Handle HTTP GET requests
 * @param {Object} e - Event object containing request parameters
 * @returns {GoogleAppsScript.Content.TextOutput} JSON response
 */
function doGet(e) {
  return handleRequest(e, 'GET');
}

/**
 * Handle HTTP POST requests
 * @param {Object} e - Event object containing request parameters and post data
 * @returns {GoogleAppsScript.Content.TextOutput} JSON response
 */
function doPost(e) {
  return handleRequest(e, 'POST');
}

/**
 * Handle OPTIONS requests (CORS preflight)
 */
function doOptions(e) {
  return ContentService
    .createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setContent('{}');
}

/**
 * Main request handler
 * @param {Object} e - Event object
 * @param {string} method - HTTP method (GET or POST)
 * @returns {GoogleAppsScript.Content.TextOutput} JSON response
 */
function handleRequest(e, method) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    // Get action parameter
    const action = e.parameter.action;
    if (!action) {
      return output.setContent(JSON.stringify(
        errorResponse('Missing action parameter', 'MISSING_ACTION')
      ));
    }

    // Health check doesn't require authentication
    if (action === 'health') {
      return output.setContent(JSON.stringify(
        successResponse({ status: 'ok', timestamp: new Date().toISOString() })
      ));
    }

    // Get authenticated user
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
      return output.setContent(JSON.stringify(
        errorResponse('Authentication required', 'UNAUTHORIZED')
      ));
    }

    const currentUser = getUserByEmail(userEmail);
    if (!currentUser) {
      return output.setContent(JSON.stringify(
        errorResponse('User not found in system. Please contact your administrator.', 'USER_NOT_FOUND')
      ));
    }

    // Parse payload for POST requests
    let payload = {};
    if (method === 'POST' && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseError) {
        return output.setContent(JSON.stringify(
          errorResponse('Invalid JSON in request body', 'INVALID_JSON')
        ));
      }
    } else if (method === 'GET') {
      payload = e.parameter;
    }

    // Route to appropriate handler
    let result;
    switch(action) {
      // ========================================================================
      // USER ENDPOINTS
      // ========================================================================
      case 'getCurrentUser':
        result = handleGetCurrentUser(currentUser);
        break;
      case 'getUsers':
        result = handleGetUsers(currentUser);
        break;
      case 'getDirectReports':
        result = handleGetDirectReports(currentUser);
        break;

      // ========================================================================
      // PTO MODULE ENDPOINTS
      // ========================================================================
      case 'getPtoRequests':
        result = handleGetPtoRequests(currentUser, payload);
        break;
      case 'getPtoRequest':
        result = handleGetPtoRequest(currentUser, payload);
        break;
      case 'createPtoRequest':
        result = handleCreatePtoRequest(currentUser, payload);
        break;
      case 'updatePtoRequest':
        result = handleUpdatePtoRequest(currentUser, payload);
        break;
      case 'approvePtoRequest':
        result = handleApprovePtoRequest(currentUser, payload);
        break;
      case 'denyPtoRequest':
        result = handleDenyPtoRequest(currentUser, payload);
        break;
      case 'cancelPtoRequest':
        result = handleCancelPtoRequest(currentUser, payload);
        break;
      case 'getPtoBalance':
        result = handleGetPtoBalance(currentUser, payload);
        break;
      case 'getHolidays':
        result = handleGetHolidays(currentUser);
        break;
      case 'createHoliday':
        result = handleCreateHoliday(currentUser, payload);
        break;
      case 'deleteHoliday':
        result = handleDeleteHoliday(currentUser, payload);
        break;
      case 'getBlackoutDates':
        result = handleGetBlackoutDates(currentUser);
        break;
      case 'createBlackoutDate':
        result = handleCreateBlackoutDate(currentUser, payload);
        break;
      case 'deleteBlackoutDate':
        result = handleDeleteBlackoutDate(currentUser, payload);
        break;
      case 'getSystemConfig':
        result = handleGetSystemConfig(currentUser);
        break;
      case 'updateSystemConfig':
        result = handleUpdateSystemConfig(currentUser, payload);
        break;

      // ========================================================================
      // EVALUATION MODULE ENDPOINTS
      // ========================================================================
      case 'getEvaluationCycles':
        result = handleGetCycles(currentUser);
        break;
      case 'getActiveCycle':
        result = handleGetActiveCycle(currentUser);
        break;
      case 'getEvaluations':
        result = handleGetEvaluations(currentUser, payload);
        break;
      case 'getEvaluation':
        result = handleGetEvaluation(currentUser, payload);
        break;
      case 'createEvaluation':
        result = handleCreateEvaluation(currentUser, payload);
        break;
      case 'updateEvaluationStatus':
        result = handleUpdateEvaluationStatus(currentUser, payload);
        break;
      case 'pullBackEvaluation':
        result = handlePullBackEvaluation(currentUser, payload);
        break;
      case 'saveRatings':
        result = handleSaveRatings(currentUser, payload);
        break;
      case 'saveGoals':
        result = handleSaveGoals(currentUser, payload);
        break;
      case 'getPeerReviewRequests':
        result = handleGetPeerReviewRequests(currentUser);
        break;
      case 'submitPeerReview':
        result = handleSubmitPeerReview(currentUser, payload);
        break;
      case 'createPeerReviewRequest':
        result = handleCreatePeerReviewRequest(currentUser, payload);
        break;
      case 'getCompetencies':
        result = handleGetCompetencies(currentUser);
        break;
      case 'saveCompetency':
        result = handleSaveCustomCompetency(currentUser, payload);
        break;
      case 'deleteCompetency':
        result = handleDeleteCustomCompetency(currentUser, payload);
        break;

      default:
        result = errorResponse('Unknown action: ' + action, 'UNKNOWN_ACTION');
    }

    // Set CORS headers and return response
    return output
      .setContent(JSON.stringify(result))
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');

  } catch (error) {
    Logger.log('Error in handleRequest: ' + error.message);
    Logger.log('Stack trace: ' + error.stack);

    return output
      .setContent(JSON.stringify(
        errorResponse('Internal server error: ' + error.message, 'INTERNAL_ERROR')
      ))
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}
