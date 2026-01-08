/**
 * Peer Review Service
 * Handles peer review requests and submissions
 */

/**
 * Get peer review requests for the current user
 * @param {Object} currentUser - The authenticated user
 * @returns {Object} Success or error response
 */
function handleGetPeerReviewRequests(currentUser) {
  try {
    const sheet = getSheet(SHEET_NAMES.PEER_REVIEW_REQUESTS);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return successResponse([]); // No requests
    }

    const colMap = COLUMN_MAPS.PEER_REVIEW_REQUESTS;
    const requests = [];

    // Get requests where current user is the reviewer
    for (let i = 1; i < data.length; i++) {
      const request = rowToPeerRequest(colMap, data[i]);

      if (request.reviewerId === currentUser.id) {
        // Enrich with ratings if completed
        if (request.status === PEER_REQUEST_STATUSES.COMPLETED) {
          const ratingsSheet = getSheet(SHEET_NAMES.RATINGS);
          const ratingsData = ratingsSheet.getDataRange().getValues();
          const ratingsColMap = COLUMN_MAPS.RATINGS;

          const ratings = [];
          for (let j = 1; j < ratingsData.length; j++) {
            const rating = rowToRating(ratingsColMap, ratingsData[j]);
            if (rating.evaluationId === request.evaluationId &&
                rating.ratingType === RATING_TYPES.PEER &&
                rating.reviewerId === currentUser.id) {
              ratings.push({
                competencyId: rating.competencyId,
                score: rating.score,
                comments: rating.comments
              });
            }
          }

          request.ratings = ratings;
        } else {
          request.ratings = [];
        }

        requests.push(request);
      }
    }

    return successResponse(requests);

  } catch (error) {
    Logger.log('Error in handleGetPeerReviewRequests: ' + error.message);
    return errorResponse('Failed to retrieve peer review requests', 'GET_PEER_REQUESTS_ERROR');
  }
}

/**
 * Submit a peer review
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Request payload with requestId and ratings
 * @returns {Object} Success or error response
 */
function handleSubmitPeerReview(currentUser, payload) {
  const { requestId, ratings } = payload;

  if (!requestId || !ratings) {
    return errorResponse('Missing required fields: requestId, ratings', 'MISSING_PARAMETERS');
  }

  try {
    // Get the peer review request
    const requestSheet = getSheet(SHEET_NAMES.PEER_REVIEW_REQUESTS);
    const requestRowIndex = findRowById(requestSheet, COLUMN_MAPS.PEER_REVIEW_REQUESTS.id, requestId);

    if (requestRowIndex === -1) {
      return errorResponse('Peer review request not found', 'REQUEST_NOT_FOUND');
    }

    const requestData = requestSheet.getDataRange().getValues();
    const request = rowToPeerRequest(COLUMN_MAPS.PEER_REVIEW_REQUESTS, requestData[requestRowIndex - 1]);

    // Authorization: must be the assigned reviewer
    if (request.reviewerId !== currentUser.id) {
      return errorResponse('Unauthorized: You are not the assigned reviewer', 'UNAUTHORIZED');
    }

    // Check if already completed
    if (request.status === PEER_REQUEST_STATUSES.COMPLETED) {
      return errorResponse('This peer review has already been submitted', 'ALREADY_COMPLETED');
    }

    const evaluationId = request.evaluationId;

    // Delete existing peer ratings from this reviewer for this evaluation
    const ratingsSheet = getSheet(SHEET_NAMES.RATINGS);
    const ratingsData = ratingsSheet.getDataRange().getValues();
    const ratingsColMap = COLUMN_MAPS.RATINGS;

    for (let i = ratingsData.length - 1; i >= 1; i--) {
      const rating = rowToRating(ratingsColMap, ratingsData[i]);
      if (rating.evaluationId === evaluationId &&
          rating.ratingType === RATING_TYPES.PEER &&
          rating.reviewerId === currentUser.id) {
        deleteRow(SHEET_NAMES.RATINGS, i + 1);
      }
    }

    // Insert new peer ratings
    const now = getCurrentTimestamp();
    for (const rating of ratings) {
      const ratingId = generateId('r');
      const rowData = [
        ratingId,                     // id
        evaluationId,                 // evaluationId
        RATING_TYPES.PEER,            // ratingType
        rating.competencyId,          // competencyId
        rating.score,                 // score
        rating.comments || '',        // comments
        currentUser.id,               // reviewerId
        now,                          // createdAt
        now                           // updatedAt
      ];

      appendRow(SHEET_NAMES.RATINGS, rowData);
    }

    // Update request status to Completed
    const updatedRequestRow = requestData[requestRowIndex - 1];
    updatedRequestRow[COLUMN_MAPS.PEER_REVIEW_REQUESTS.status] = PEER_REQUEST_STATUSES.COMPLETED;
    updatedRequestRow[COLUMN_MAPS.PEER_REVIEW_REQUESTS.updatedAt] = now;
    updateRow(SHEET_NAMES.PEER_REVIEW_REQUESTS, requestRowIndex, updatedRequestRow);

    // Return updated request
    const updatedRequest = {
      ...request,
      status: PEER_REQUEST_STATUSES.COMPLETED,
      ratings: ratings,
      updatedAt: now
    };

    return successResponse(updatedRequest);

  } catch (error) {
    Logger.log('Error in handleSubmitPeerReview: ' + error.message);
    return errorResponse('Failed to submit peer review', 'SUBMIT_PEER_REVIEW_ERROR');
  }
}

/**
 * Create a peer review request
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Request payload with evaluationId, reviewerId
 * @returns {Object} Success or error response
 */
function handleCreatePeerReviewRequest(currentUser, payload) {
  const { evaluationId, reviewerId } = payload;

  if (!evaluationId || !reviewerId) {
    return errorResponse('Missing required fields: evaluationId, reviewerId', 'MISSING_PARAMETERS');
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

    // Authorization: must be manager or admin
    if (!isManager(currentUser) && !isAdmin(currentUser)) {
      return errorResponse('Unauthorized: Only managers can create peer review requests', 'UNAUTHORIZED');
    }

    // Get reviewer and target user info
    const reviewer = getUserById(reviewerId);
    const targetUser = getUserById(evaluation.employeeId);

    if (!reviewer || !targetUser) {
      return errorResponse('Reviewer or target user not found', 'USER_NOT_FOUND');
    }

    // Create the request
    const requestId = generateId('pr');
    const now = getCurrentTimestamp();

    const rowData = [
      requestId,                             // id
      evaluationId,                          // evaluationId
      reviewerId,                            // reviewerId
      evaluation.employeeId,                 // targetUserId
      targetUser.name,                       // targetUserName (denormalized)
      PEER_REQUEST_STATUSES.PENDING,         // status
      now,                                   // createdAt
      now                                    // updatedAt
    ];

    appendRow(SHEET_NAMES.PEER_REVIEW_REQUESTS, rowData);

    const newRequest = {
      id: requestId,
      evaluationId,
      reviewerId,
      targetUserId: evaluation.employeeId,
      targetUserName: targetUser.name,
      status: PEER_REQUEST_STATUSES.PENDING,
      ratings: [],
      createdAt: now,
      updatedAt: now
    };

    return successResponse(newRequest);

  } catch (error) {
    Logger.log('Error in handleCreatePeerReviewRequest: ' + error.message);
    return errorResponse('Failed to create peer review request', 'CREATE_REQUEST_ERROR');
  }
}
