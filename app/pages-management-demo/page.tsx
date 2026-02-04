'use client';

import React, { useState } from 'react';
import { MessageSquare, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AdminMessageForm } from '@/components/AdminMessageForm';
import { PageMembers } from '@/components/PageMembers';
import { PollForm } from '@/components/PollForm';
import { ProfileImageUpload } from '@/components/ProfileImageUpload';

/**
 * Example integration page showing how to use all the new page management features
 * This is a demo page - adapt it to your actual page structure
 */
export default function PageManagementDemo() {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'polls' | 'contact'>('overview');
  const [showContactForm, setShowContactForm] = useState(false);

  // Demo data - replace with actual data from your API
  const pageId = 'demo-page-id';
  const isUserAdmin = true; // Replace with actual user check
  const isUserMember = true;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Page Management Features</h1>
          <p className="text-gray-400">Complete admin and member management system</p>
        </div>

        {/* Feature Tabs */}
        <div className="bg-gray-800/50 rounded-lg border border-amber-500/20 overflow-hidden mb-8">
          <div className="grid grid-cols-4 border-b border-amber-500/10">
            {[
              { id: 'overview', label: 'Overview', icon: Settings },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'polls', label: 'Polls', icon: MessageSquare },
              { id: 'contact', label: 'Contact Admin', icon: MessageSquare },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`p-4 flex items-center justify-center space-x-2 transition border-b-2 ${
                  activeTab === id
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-300 mb-2">👥 Member Management</h3>
                    <p className="text-sm text-gray-300 mb-3">
                      Add, remove, and manage page members with different role levels
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveTab('members')}
                    >
                      Manage Members
                    </Button>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-300 mb-2">📊 Polls & Surveys</h3>
                    <p className="text-sm text-gray-300 mb-3">
                      Create polls with multiple options and let members vote
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveTab('polls')}
                    >
                      Create Poll
                    </Button>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h3 className="font-semibold text-green-300 mb-2">📨 Admin Messages</h3>
                    <p className="text-sm text-gray-300 mb-3">
                      Members can send direct messages to page administrators
                    </p>
                    {isUserMember && !isUserAdmin && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowContactForm(true)}
                      >
                        Contact Admin
                      </Button>
                    )}
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-300 mb-2">🖼️ Profile Image</h3>
                    <p className="text-sm text-gray-300 mb-3">
                      Upload page profile images directly without external URLs
                    </p>
                    {isUserAdmin && (
                      <Button variant="secondary" size="sm">
                        Upload Image
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800/30 border border-amber-500/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">🔐 Security Features</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>✅ Authentication required for all operations</li>
                    <li>✅ Admin-only management endpoints</li>
                    <li>✅ Member verification for messaging</li>
                    <li>✅ File validation and size limits</li>
                    <li>✅ Role-based access control</li>
                    <li>✅ Cascade deletion protection</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && isUserAdmin && (
              <PageMembers pageId={pageId} isAdmin={true} />
            )}

            {/* Polls Tab */}
            {activeTab === 'polls' && isUserAdmin && (
              <div className="space-y-6">
                <PollForm pageId={pageId} onPollCreated={() => {}} />
              </div>
            )}

            {/* Contact Admin Tab */}
            {activeTab === 'contact' && isUserMember && (
              <div className="max-w-lg mx-auto">
                <p className="text-gray-300 mb-4">
                  Send a message directly to the page administrators
                </p>
                <AdminMessageForm
                  pageId={pageId}
                  isOpen={true}
                  onMessageSent={() => setActiveTab('overview')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Code Examples */}
        <div className="bg-gray-800/30 border border-amber-500/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">💻 Integration Examples</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-amber-300 mb-2">Member Management</h3>
              <pre className="bg-gray-900 p-3 rounded-lg text-xs overflow-x-auto text-gray-300">
{`// Get page members
const members = await fetch(\`/api/pages/\${pageId}/members\`);

// Add member
await fetch(\`/api/pages/\${pageId}/members\`, {
  method: 'POST',
  body: JSON.stringify({ userId, role: 'member' })
});`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-amber-300 mb-2">Send Admin Message</h3>
              <pre className="bg-gray-900 p-3 rounded-lg text-xs overflow-x-auto text-gray-300">
{`await fetch('/api/admin-messages', {
  method: 'POST',
  body: JSON.stringify({
    pageId: '...',
    subject: 'Issue Report',
    content: 'Message content...'
  })
});`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-amber-300 mb-2">Create Poll</h3>
              <pre className="bg-gray-900 p-3 rounded-lg text-xs overflow-x-auto text-gray-300">
{`await fetch('/api/polls', {
  method: 'POST',
  body: JSON.stringify({
    pageId: '...',
    question: 'What feature should we add?',
    options: ['Option A', 'Option B'],
    allowMultiple: false
  })
});`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      <AdminMessageForm
        pageId={pageId}
        isOpen={showContactForm}
        onClose={() => setShowContactForm(false)}
        onMessageSent={() => {
          setShowContactForm(false);
          setActiveTab('overview');
        }}
      />
    </div>
  );
}
