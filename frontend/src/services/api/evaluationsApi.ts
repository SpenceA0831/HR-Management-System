import { apiClient } from './apiClient';
import type {
  ApiResponse,
  EvaluationCycle,
  Competency,
} from '../../types';

// ============================================================================
// EVALUATION CYCLES
// ============================================================================

export async function getEvaluationCycles(): Promise<ApiResponse<EvaluationCycle[]>> {
  return apiClient.get<EvaluationCycle[]>('getEvaluationCycles');
}

export async function getActiveCycle(): Promise<ApiResponse<EvaluationCycle>> {
  return apiClient.get<EvaluationCycle>('getActiveCycle');
}

// ============================================================================
// COMPETENCIES
// ============================================================================

export async function getCompetencies(): Promise<ApiResponse<Competency[]>> {
  return apiClient.get<Competency[]>('getCompetencies');
}

export async function saveCompetency(data: {
  id?: string;
  name: string;
  description: string;
  category: 'Org-Wide' | 'Role-Specific';
  roleType?: string;
}): Promise<ApiResponse<Competency>> {
  return apiClient.post<Competency>('saveCompetency', data);
}

export async function deleteCompetency(competencyId: string): Promise<ApiResponse<{ deleted: boolean }>> {
  return apiClient.post<{ deleted: boolean }>('deleteCompetency', { competencyId });
}
