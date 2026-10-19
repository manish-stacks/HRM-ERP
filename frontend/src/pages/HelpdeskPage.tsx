import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Send,
  X,
  AlertCircle
} from 'lucide-react';

export const HelpdeskPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    category: 'IT',
    priority: 'MEDIUM',
    subject: '',
    description: ''
  });

  const loadTickets = async () => {
    try {
      const res = await api.get('/helpdesk/tickets');
      if (res.data?.success) setTickets(res.data.data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/helpdesk/tickets', ticketForm);
      if (res.data?.success) {
        setShowCreateModal(false);
        setTicketForm({ category: 'IT', priority: 'MEDIUM', subject: '', description: '' });
        loadTickets();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create ticket');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;

    try {
      const res = await api.post(`/helpdesk/tickets/${selectedTicket.id}/comments`, { comment: newComment });
      if (res.data?.success) {
        setSelectedTicket({
          ...selectedTicket,
          comments: [...(selectedTicket.comments || []), res.data.data]
        });
        setNewComment('');
        loadTickets();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post reply');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HR & Workplace Helpdesk</h1>
          <p className="text-sm text-slate-500">Employee inquiry ticketing, IT issues, payroll queries, and dispute tracking.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> Open Support Ticket
        </button>
      </div>

      {/* Ticket List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Submitted By</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 font-mono font-bold text-xs text-blue-600">
                    {t.ticketNumber}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-800">
                    {t.category}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900 text-xs max-w-sm truncate">
                    {t.subject}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {t.createdBy?.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      t.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedTicket(t)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-xs font-medium transition"
                    >
                      View Thread ({t.comments?.length || 0})
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Thread Discussion Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600">{selectedTicket.ticketNumber}</span>
                <h3 className="text-base font-bold text-slate-900">{selectedTicket.subject}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
              <strong className="text-slate-900">Original Inquiry:</strong>
              <p className="mt-1">{selectedTicket.description}</p>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 min-h-[160px] p-2">
              {selectedTicket.comments?.map((c: any) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>{c.user?.email}</span>
                    <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-800">{c.comment}</p>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                required
                placeholder="Post reply to this inquiry..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" /> Reply
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Open Support Ticket</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="IT">IT & Hardware</option>
                    <option value="HR">HR & Personnel</option>
                    <option value="PAYROLL">Payroll & Tax</option>
                    <option value="GENERAL">General Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of request..."
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Please describe the request or hardware problem in detail..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

