// File: frontend/src/components/TaskList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { publish } from '../utils/eventBus';
import Loading from './shared/Loading';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  const apiBase = import.meta.env.VITE_API_URL;

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to see your tasks');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${apiBase}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      setError(serverMsg || 'Could not load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    // Optimistic UI: insert a temporary task immediately
    const tempId = `temp-${Date.now()}`;
    const tempTask = {
      _id: tempId,
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      status: 'pending',
      optimistic: true
    };
    const previous = tasks;
    setTasks([tempTask, ...tasks]);
    setShowForm(false);
    resetForm();
    publish('tasks:updated', { action: 'create', task: tempTask });

    try {
      const res = await axios.post(`${apiBase}/api/tasks`, {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Replace temp task with server task
      setTasks((cur) => cur.map(t => t._id === tempId ? res.data : t));
      publish('tasks:updated', { action: 'create', task: res.data });
    } catch (err) {
      console.error('Error creating task:', err);
      const serverMsg = err.response?.data?.message || err.message;
      setError(serverMsg || 'Could not create task');
      // rollback
      setTasks(previous);
      publish('tasks:updated', { action: 'create:failed' });
    }
  };

  const toggleTaskStatus = async (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    // optimistic update
    const prevTasks = tasks;
    setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    publish('tasks:updated', { action: 'update', task: { ...task, status: newStatus } });

    try {
      const res = await axios.patch(`${apiBase}/api/tasks/${taskId}`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(cur => cur.map(t => t._id === taskId ? res.data : t));
      publish('tasks:updated', { action: 'update', task: res.data });
    } catch (err) {
      console.error('Error updating task:', err);
      const serverMsg = err.response?.data?.message || err.message;
      setError(serverMsg || 'Could not update task');
      // rollback
      setTasks(prevTasks);
      publish('tasks:updated', { action: 'update:failed', taskId });
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    // optimistic remove
    const prevTasks = tasks;
    setTasks(tasks.filter(t => t._id !== taskId));
    publish('tasks:updated', { action: 'delete', taskId });

    try {
      await axios.delete(`${apiBase}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // success - nothing to do (already removed)
    } catch (err) {
      console.error('Error deleting task:', err);
      const serverMsg = err.response?.data?.message || err.message;
      setError(serverMsg || 'Could not delete task');
      // rollback
      setTasks(prevTasks);
      publish('tasks:updated', { action: 'delete:failed', taskId });
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
  };

  const priorityColor = {
    low: { bg: 'bg-green-100', text: 'text-green-800' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    high: { bg: 'bg-red-100', text: 'text-red-800' }
  };

  return (
    <div className="space-y-6">
      {/* Add Task Button or Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-sm border border-orange-100"
      >
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all"
          >
            Add New Task
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows="2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="low">Low 🟢</option>
                  <option value="medium">Medium 🟡</option>
                  <option value="high">High 🔴</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Add Task
              </button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Task List */}
      <div className="space-y-4">
        {loading ? (
          <Loading />
        ) : tasks.length === 0 ? (
          <div className="text-center text-gray-500">No tasks yet. Add one to get started!</div>
        ) : (
          tasks.map((task, index) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-4 rounded-lg shadow-sm border border-orange-100 flex items-start gap-4"
            >
              <input
                type="checkbox"
                checked={task.status === 'completed'}
                onChange={() => toggleTaskStatus(task._id)}
                className="mt-1.5 h-4 w-4 text-orange-600 rounded border-gray-300"
              />
              
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${priorityColor[task.priority]?.bg} ${priorityColor[task.priority]?.text}`}>
                    {task.priority}
                  </span>
                </div>
                
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}
                
                {task.dueDate && !isNaN(new Date(task.dueDate)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              <button
                onClick={() => deleteTask(task._id)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;