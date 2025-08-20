import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { TaskStatus, TaskPriority, Task, SuggestedTask } from '../../types/goals';
import { getTasksByGoal, createTask, updateTask, deleteTask, reorderTasks, generateTasks } from '../../app/api/tasks';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { Button as MuiButton } from '@mui/material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// Material UI icons
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PsychologyIcon from '@mui/icons-material/Psychology';

interface TaskListProps {
  goalId: number;
  goalDeadline: string | Date;
  onTabChange: (tab: 'ai-evaluation') => void;
}

const TaskContainer = styled.div`
  margin-top: 2rem;
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const HeaderButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  
  /* Improve touch handling for mobile drag and drop */
  @media (max-width: 768px) {
    touch-action: pan-y; /* Allow vertical scrolling but prevent horizontal gestures */
  }
`;

const TaskItem = styled.div<{ priority: TaskPriority }>`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => {
    switch (props.priority) {
      case TaskPriority.URGENT:
        return '#f44336';
      case TaskPriority.HIGH:
        return '#ff9800';
      case TaskPriority.MEDIUM:
        return '#2196F3';
      case TaskPriority.LOW:
        return '#4CAF50';
      default:
        return '#9e9e9e';
    }
  }};
  transition: box-shadow 0.2s ease;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  /* Prevent text selection during drag */
  &[data-dragging="true"] {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.9rem;
  cursor: grab;
  user-select: none;
  touch-action: none; /* Prevent scrolling on touch */
  -webkit-touch-callout: none; /* Disable callout on iOS */
  -webkit-user-select: none; /* Disable text selection on iOS */

  &:active {
    cursor: grabbing;
  }

  .mobile-text {
    display: none;
  }

  .desktop-text {
    display: inline;
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
    border-radius: 4px;
    background-color: #e3f2fd;
    border: 1px dashed #2196F3;
    min-height: 48px; /* Larger touch target on mobile */
    font-size: 1rem;
    
    &:active {
      background-color: #bbdefb;
    }

    .mobile-text {
      display: inline;
    }

    .desktop-text {
      display: none;
    }
  }
`;

const TaskTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
`;

const TaskDescription = styled.p`
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
`;

const TaskMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #666;
`;

const StatusBadge = styled.span<{ status: TaskStatus }>`
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background-color: ${props => {
    switch (props.status) {
      case TaskStatus.PENDING:
        return '#9e9e9e';
      case TaskStatus.ACTIVE:
        return '#2196F3';
      case TaskStatus.COMPLETED:
        return '#4CAF50';
      default:
        return '#9e9e9e';
    }
  }};
  color: white;
`;

const AddTaskButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: #1976d2;
  }
`;

const TaskForm = styled.form`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: ${rotate} 1s linear infinite;
  margin-right: 0.5rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary', isLoading?: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  background-color: ${props => props.variant === 'secondary' ? '#9e9e9e' : '#2196F3'};
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  transition: all 0.3s ease;
  gap: 0.5rem;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
`;

const EmptyStateMessage = styled.div`
  text-align: center;
  padding: 2rem;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 1rem 0;
  color: #666;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const GenerateButton = styled(Button)`
  background-color: #4CAF50;
  
  &:hover {
    background-color: #45a049;
  }
`;

const DropdownContent = styled.div<{ expanded: boolean }>`
  max-height: ${({ expanded }) => (expanded ? '1000px' : '0')};
  opacity: ${({ expanded }) => (expanded ? 1 : 0)};
  overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
  will-change: max-height, opacity;
`;

const MobileStatusRow = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.1rem;
  }
`;

const MobileStatusBadge = styled(StatusBadge)`
  display: none;
  @media (max-width: 768px) {
    display: inline-block;
  }
`;

const DesktopStatusBadge = styled(StatusBadge)`
  @media (max-width: 768px) {
    display: none;
  }
`;

const DesktopDueDate = styled.span`
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.1rem;
  display: block;
  @media (max-width: 768px) {
    display: none;
  }
`;

interface SortableTaskItemProps {
  task: Task;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  onDelete: (taskId: number) => void;
  onEdit: (taskId: number, updatedTask: Partial<Task>) => void;
  loadingAction: { taskId: number; action: string } | null;
  editingTaskId: number | null;
  onEditModeChange: (taskId: number | null) => void;
  goalDeadline: string | Date;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({ 
  task, 
  onStatusChange, 
  onDelete, 
  onEdit,
  loadingAction,
  editingTaskId,
  onEditModeChange,
  goalDeadline
}) => {
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || '',
    deadline: new Date(task.deadline).toISOString().slice(0, 10)
  });
  const [expanded, setExpanded] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  const isEditing = editingTaskId === task.id;

  const handleEditClick = () => {
    setEditForm({
      title: task.title,
      description: task.description || '',
      deadline: new Date(task.deadline).toISOString().slice(0, 10)
    });
    onEditModeChange(task.id);
    setExpanded(true); // Expand when editing
  };

  const handleSaveClick = () => {
    onEdit(task.id, {
      title: editForm.title,
      description: editForm.description,
      deadline: editForm.deadline
    });
    onEditModeChange(null);
  };

  const handleCancelEdit = () => {
    setEditForm({
      title: task.title,
      description: task.description || '',
      deadline: new Date(task.deadline).toISOString().slice(0, 10)
    });
    onEditModeChange(null);
  };

  return (
    <TaskItem
      ref={setNodeRef}
      priority={task.priority}
      style={style}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!isEditing && (
              <DragHandle {...attributes} {...listeners}>
                <span>⋮⋮</span>
              </DragHandle>
            )}
            <TaskTitle style={{ margin: 0 }}>{task.title}</TaskTitle>
          </div>
          <MobileStatusRow>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>Due: {new Date(task.deadline).toLocaleDateString()}</span>
            <MobileStatusBadge status={task.status}>{task.status}</MobileStatusBadge>
          </MobileStatusRow>
          <DesktopDueDate>
            Due: {new Date(task.deadline).toLocaleDateString()}
          </DesktopDueDate>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DesktopStatusBadge status={task.status}>
            {task.status}
          </DesktopStatusBadge>
          <button
            type="button"
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
            onClick={() => setExpanded((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.2rem',
              marginLeft: '0.5rem',
              padding: 0,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronRightIcon style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </div>
      <DropdownContent expanded={expanded} style={{ marginTop: expanded ? '0.75rem': 0 }}>
        {expanded ? (
          isEditing ? (
            <div>
              <FormGroup>
                <Label>Title</Label>
                <Input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  maxLength={100}
                  required
                />
                {editForm.title.length > 0 && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: editForm.title.length > 100 ? '#d32f2f' : editForm.title.length > 80 ? '#f57c00' : '#666',
                    textAlign: 'right',
                    marginTop: '0.25rem'
                  }}>
                    {editForm.title.length}/100 characters
                  </div>
                )}
              </FormGroup>
              <FormGroup>
                <Label>Description</Label>
                <TextArea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  style={{ minHeight: '80px' }}
                />
              </FormGroup>
              <FormGroup>
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                  min={todayStr}
                  max={new Date(goalDeadline).toISOString().slice(0, 10)}
                  required
                />
              </FormGroup>
              <ButtonGroup>
                <Button
                  onClick={handleSaveClick}
                  disabled={!!loadingAction || !editForm.title.trim()}
                >
                  {loadingAction?.taskId === task.id && loadingAction?.action === 'edit' && <LoadingSpinner />}
                  <ButtonContent>Save</ButtonContent>
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleCancelEdit}
                  disabled={!!loadingAction}
                >
                  <ButtonContent>Cancel</ButtonContent>
                </Button>
              </ButtonGroup>
            </div>
          ) : (
            <>
              {task.description && <TaskDescription>{task.description}</TaskDescription>}
              <TaskMeta>
                <ButtonGroup>
                  <Button
                    variant="secondary"
                    onClick={handleEditClick}
                    disabled={!!loadingAction}
                  >
                    <ButtonContent>Edit</ButtonContent>
                  </Button>
                  {task.status === TaskStatus.PENDING && (
                    <Button
                      variant="secondary"
                      onClick={() => onStatusChange(task.id, TaskStatus.ACTIVE)}
                      disabled={!!loadingAction}
                    >
                      {loadingAction?.taskId === task.id && loadingAction?.action === 'status-ACTIVE' && <LoadingSpinner />}
                      <ButtonContent>Start Task</ButtonContent>
                    </Button>
                  )}
                  {task.status === TaskStatus.ACTIVE && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => onStatusChange(task.id, TaskStatus.COMPLETED)}
                        disabled={!!loadingAction}
                      >
                        {loadingAction?.taskId === task.id && loadingAction?.action === 'status-COMPLETED' && <LoadingSpinner />}
                        <ButtonContent>Complete</ButtonContent>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => onStatusChange(task.id, TaskStatus.PENDING)}
                        disabled={!!loadingAction}
                      >
                        {loadingAction?.taskId === task.id && loadingAction?.action === 'status-PENDING' && <LoadingSpinner />}
                        <ButtonContent>Pause</ButtonContent>
                      </Button>
                    </>
                  )}
                  {task.status === TaskStatus.COMPLETED && (
                    <Button
                      variant="secondary"
                      onClick={() => onStatusChange(task.id, TaskStatus.PENDING)}
                      disabled={!!loadingAction}
                    >
                      {loadingAction?.taskId === task.id && loadingAction?.action === 'status-PENDING' && <LoadingSpinner />}
                      <ButtonContent>Reset Task</ButtonContent>
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => onDelete(task.id)}
                    disabled={!!loadingAction}
                  >
                    {loadingAction?.taskId === task.id && loadingAction?.action === 'delete' && <LoadingSpinner />}
                    <ButtonContent>Delete</ButtonContent>
                  </Button>
                </ButtonGroup>
              </TaskMeta>
            </>
          )
        ) : null}
        </DropdownContent>
    </TaskItem>
  );
};

const TaskListComponent: React.FC<TaskListProps> = ({ goalId, goalDeadline, onTabChange }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: TaskPriority.MEDIUM
  });
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<{ taskId: number; action: string } | null>(null);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    taskId: number | null;
    taskTitle: string;
  }>({
    isOpen: false,
    taskId: null,
    taskTitle: ''
  });
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300, // Longer delay to distinguish from scrolling
        tolerance: 8, // More tolerance for touch movement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasksByGoal(goalId);
      const tasksWithIds = data
        .map(task => ({
          ...task,
          id: Number(task.id)
        }))
        .sort((a, b) => a.sequence - b.sequence);
      setTasks(tasksWithIds);
      setError(null);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please try again.');
    }
  }, [goalId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask({
        ...newTask,
        goalId,
        sequence: tasks.length
      });
      await fetchTasks();
      setIsAddingTask(false);
      setNewTask({
        title: '',
        description: '',
        deadline: '',
        priority: TaskPriority.MEDIUM
      });
      setError(null);
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task. Please try again.');
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: TaskStatus) => {
    try {
      setLoadingAction({ taskId, action: `status-${newStatus}` });
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      if (newStatus === TaskStatus.COMPLETED && task.status !== TaskStatus.ACTIVE) {
        setError('Task must be active before marking as completed');
        return;
      }

      await updateTask(taskId, { status: newStatus });
      await fetchTasks();
      setError(null);
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteTask = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    const taskTitle = task?.title || 'this task';
    
    setDeleteConfirmation({
      isOpen: true,
      taskId,
      taskTitle
    });
  };

  const confirmDeleteTask = async () => {
    const { taskId } = deleteConfirmation;
    if (!taskId) return;

    try {
      setLoadingAction({ taskId, action: 'delete' });
      await deleteTask(taskId);
      await fetchTasks();
      setError(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    } finally {
      setLoadingAction(null);
      setDeleteConfirmation({ isOpen: false, taskId: null, taskTitle: '' });
    }
  };

  const cancelDeleteTask = () => {
    setDeleteConfirmation({ isOpen: false, taskId: null, taskTitle: '' });
  };

  const handleEditTask = async (taskId: number, updatedTask: Partial<Task>) => {
    try {
      setLoadingAction({ taskId, action: 'edit' });
      const updateData = {
        ...updatedTask,
        description: updatedTask.description || undefined
      };
      await updateTask(taskId, updateData);
      await fetchTasks();
      setError(null);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);
    
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newTasks = arrayMove(items, oldIndex, newIndex);
        
        // Update backend
        const taskIds = newTasks.map(task => task.id);
        reorderTasks(taskIds).catch(error => {
          console.error('Error reordering tasks:', error);
          setError('Failed to reorder tasks. Please try again.');
          fetchTasks();
        });
        
        return newTasks;
      });
    }
  };

  const handleGenerateTasks = async () => {
    try {
      setIsGeneratingTasks(true);
      setError(null);
      
      // Generate tasks (API creates them directly)
      await generateTasks(goalId);
      
      // Refresh tasks list to show the newly created tasks
      await fetchTasks();
      setError(null);
    } catch (error) {
      console.error('Error generating tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate tasks. Please try again.');
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  return (
    <TaskContainer>
      <TaskHeader>
        <h2>Tasks</h2>
        <HeaderButtonGroup>
          <GenerateButton 
            onClick={handleGenerateTasks}
            disabled={isGeneratingTasks}
          >
            {isGeneratingTasks && <LoadingSpinner />}
            {isGeneratingTasks ? 'Generating...' : 'Generate Tasks'}
          </GenerateButton>
          <AddTaskButton onClick={() => setIsAddingTask(true)}>Add Task</AddTaskButton>
        </HeaderButtonGroup>
      </TaskHeader>

      {error && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ color: 'red', marginBottom: '0.5rem' }}>
            {error}
          </div>
          {error.includes('Goal is missing required fields for task generation') && (
            <MuiButton 
              variant="contained"
              color="primary"
              onClick={() => onTabChange('ai-evaluation')}
              size="small"
              startIcon={<PsychologyIcon />}
            >
              Go to AI Evaluation to Add Required Fields
            </MuiButton>
          )}
        </div>
      )}

      {isAddingTask && (
        <TaskForm onSubmit={handleAddTask}>
          <FormGroup>
            <Label>Title</Label>
            <Input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label>Description</Label>
            <TextArea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label>Deadline</Label>
            <Input
              type="date"
              value={newTask.deadline}
              onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
              max={new Date(goalDeadline).toISOString().slice(0, 10)}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label>Priority</Label>
            <Select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
            >
              {Object.values(TaskPriority).map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </FormGroup>
          <ButtonGroup>
            <Button type="submit">Add Task</Button>
            <Button type="button" variant="secondary" onClick={() => setIsAddingTask(false)}>
              Cancel
            </Button>
          </ButtonGroup>
        </TaskForm>
      )}

      {tasks.length === 0 ? (
        <EmptyStateMessage>
          You can reach your goal step by step! Break it down into tasks and start making progress.
          <br />
          Try using the "Generate Tasks" button to get AI-powered task suggestions!
        </EmptyStateMessage>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tasks.map(task => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ 
              minHeight: '100px',
              opacity: isDragging ? 0.9 : 1,
              transition: 'opacity 0.2s ease'
            }}>
              {tasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  onStatusChange={handleUpdateTaskStatus}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  loadingAction={loadingAction}
                  editingTaskId={editingTaskId}
                  onEditModeChange={setEditingTaskId}
                  goalDeadline={goalDeadline}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete Task"
        message={
          <>
            Are you sure you want to delete <strong>"{deleteConfirmation.taskTitle}"</strong>?
            <br /><br />
            This action cannot be undone.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={!!loadingAction && loadingAction?.taskId === deleteConfirmation.taskId && loadingAction?.action === 'delete'}
        onConfirm={confirmDeleteTask}
        onCancel={cancelDeleteTask}
      />
    </TaskContainer>
  );
};

export default TaskListComponent; 