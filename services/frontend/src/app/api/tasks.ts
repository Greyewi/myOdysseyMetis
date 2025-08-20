import { Task, TaskStatus, TaskPriority, SuggestedTask } from '../../types/goals';
import { config } from '@/config';

const API_URL = config.apiUrl;

export const getTasksByGoal = async (goalId: number): Promise<Task[]> => {
  const response = await fetch(`${API_URL}/tasks/goal/${goalId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }

  return response.json();
};

export const createTask = async (taskData: {
  goalId: number;
  title: string;
  description?: string;
  deadline: string;
  priority: TaskPriority;
  sequence: number;
}): Promise<Task> => {
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    throw new Error('Failed to create task');
  }

  return response.json();
};

export const updateTask = async (
  taskId: number,
  updates: {
    title?: string;
    description?: string;
    deadline?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    sequence?: number;
  }
): Promise<Task> => {
  const response = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update task');
  }

  return response.json();
};

export const deleteTask = async (taskId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
};

export const reorderTasks = async (taskIds: number[]): Promise<void> => {
  const response = await fetch(`${API_URL}/tasks/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    },
    body: JSON.stringify({ taskIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to reorder tasks');
  }
}; 

export const generateTasks = async (goalId: number): Promise<SuggestedTask[]> => {
  const response = await fetch(`${API_URL}/tasks/${goalId}/generate-tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cryptogoals_auth_token')}`
    }
  });
  
  if (!response.ok) {
    let errorMessage = 'Failed to generate tasks';
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // If we can't parse the error response, use the generic message
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}; 