/**
 * Competency Service
 * Handles custom competency CRUD operations
 */

/**
 * Get all competencies (built-in from constants.ts + custom from sheet)
 * @param {Object} currentUser - The authenticated user
 * @returns {Object} Success or error response
 */
function handleGetCompetencies(currentUser) {
  try {
    // Get custom competencies from sheet
    const customCompetencies = getSheetData(
      SHEET_NAMES.COMPETENCIES,
      COLUMN_MAPS.COMPETENCIES,
      rowToCompetency
    );

    // Note: Built-in competencies are defined in the frontend (constants.ts)
    // This endpoint only returns custom competencies
    // The frontend will merge them with built-in ones

    return successResponse(customCompetencies);

  } catch (error) {
    Logger.log('Error in handleGetCompetencies: ' + error.message);
    return errorResponse('Failed to retrieve competencies', 'GET_COMPETENCIES_ERROR');
  }
}

/**
 * Save (create or update) a custom competency
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Request payload with competency data
 * @returns {Object} Success or error response
 */
function handleSaveCustomCompetency(currentUser, payload) {
  const { id, name, description, category, roleType } = payload;

  if (!name || !description || !category) {
    return errorResponse('Missing required fields: name, description, category', 'MISSING_PARAMETERS');
  }

  // Authorization: Admin only
  if (!canManageCompetencies(currentUser)) {
    return errorResponse('Unauthorized: Admin access required', 'UNAUTHORIZED');
  }

  try {
    const sheet = getSheet(SHEET_NAMES.COMPETENCIES);
    const now = getCurrentTimestamp();

    if (id) {
      // Update existing
      const rowIndex = findRowById(sheet, COLUMN_MAPS.COMPETENCIES.id, id);

      if (rowIndex === -1) {
        return errorResponse('Competency not found', 'COMPETENCY_NOT_FOUND');
      }

      const data = sheet.getDataRange().getValues();
      const updatedRow = data[rowIndex - 1];
      updatedRow[COLUMN_MAPS.COMPETENCIES.name] = name;
      updatedRow[COLUMN_MAPS.COMPETENCIES.description] = description;
      updatedRow[COLUMN_MAPS.COMPETENCIES.category] = category;
      updatedRow[COLUMN_MAPS.COMPETENCIES.roleType] = roleType || '';

      updateRow(SHEET_NAMES.COMPETENCIES, rowIndex, updatedRow);

      const updatedCompetency = {
        id,
        name,
        description,
        category,
        roleType: roleType || null,
        isCustom: true,
        createdAt: updatedRow[COLUMN_MAPS.COMPETENCIES.createdAt]
      };

      return successResponse(updatedCompetency);

    } else {
      // Create new
      const competencyId = generateId('custom');

      const rowData = [
        competencyId,           // id
        name,                   // name
        description,            // description
        category,               // category
        roleType || '',         // roleType
        true,                   // isCustom
        now                     // createdAt
      ];

      appendRow(SHEET_NAMES.COMPETENCIES, rowData);

      const newCompetency = {
        id: competencyId,
        name,
        description,
        category,
        roleType: roleType || null,
        isCustom: true,
        createdAt: now
      };

      return successResponse(newCompetency);
    }

  } catch (error) {
    Logger.log('Error in handleSaveCustomCompetency: ' + error.message);
    return errorResponse('Failed to save competency', 'SAVE_COMPETENCY_ERROR');
  }
}

/**
 * Delete a custom competency
 * @param {Object} currentUser - The authenticated user
 * @param {Object} payload - Request payload with competencyId
 * @returns {Object} Success or error response
 */
function handleDeleteCustomCompetency(currentUser, payload) {
  const { competencyId } = payload;

  if (!competencyId) {
    return errorResponse('Missing competencyId parameter', 'MISSING_PARAMETER');
  }

  // Authorization: Admin only
  if (!canManageCompetencies(currentUser)) {
    return errorResponse('Unauthorized: Admin access required', 'UNAUTHORIZED');
  }

  try {
    const sheet = getSheet(SHEET_NAMES.COMPETENCIES);
    const rowIndex = findRowById(sheet, COLUMN_MAPS.COMPETENCIES.id, competencyId);

    if (rowIndex === -1) {
      return errorResponse('Competency not found', 'COMPETENCY_NOT_FOUND');
    }

    // TODO: Check if competency is used in any ratings before deleting
    // For now, just delete it

    deleteRow(SHEET_NAMES.COMPETENCIES, rowIndex);

    return successResponse({ deleted: true, competencyId });

  } catch (error) {
    Logger.log('Error in handleDeleteCustomCompetency: ' + error.message);
    return errorResponse('Failed to delete competency', 'DELETE_COMPETENCY_ERROR');
  }
}
