'use client'

import { useState, useEffect } from 'react'

interface Rule {
  id?: string
  enabled?: boolean
  priority?: number
  match_type?: string
  match_value?: string
  actions_json?: any
}

interface RuleEditorProps {
  rule: Rule
  onSave: () => void
  onCancel: () => void
}

export function RuleEditor({ rule, onSave, onCancel }: RuleEditorProps) {
  const [enabled, setEnabled] = useState(rule.enabled !== false)
  const [priority, setPriority] = useState(rule.priority || 0)
  const [matchType, setMatchType] = useState(rule.match_type || 'contains')
  const [matchValue, setMatchValue] = useState(rule.match_value || '')
  const [applyTag, setApplyTag] = useState(rule.actions_json?.apply_tag || '')
  const [setStatus, setSetStatus] = useState(rule.actions_json?.set_status || '')
  const [assignTo, setAssignTo] = useState(rule.actions_json?.assign_to || '')
  const [autoReplyTemplate, setAutoReplyTemplate] = useState(rule.actions_json?.auto_reply_template_id || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!matchValue.trim()) {
      alert('Match value is required')
      return
    }

    setSaving(true)
    try {
      const actions_json: any = {}
      if (applyTag) actions_json.apply_tag = applyTag
      if (setStatus) actions_json.set_status = setStatus
      if (assignTo) actions_json.assign_to = assignTo
      if (autoReplyTemplate) actions_json.auto_reply_template_id = autoReplyTemplate

      const payload = {
        enabled,
        priority: parseInt(priority.toString()),
        match_type: matchType,
        match_value: matchValue,
        actions_json,
      }

      const url = rule.id ? `/api/automation/rules/${rule.id}` : '/api/automation/rules'
      const method = rule.id ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onSave()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save rule')
      }
    } catch (error) {
      console.error('Error saving rule:', error)
      alert('Failed to save rule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        padding: '20px',
        border: '2px solid #1976d2',
        borderRadius: '8px',
        marginBottom: '20px',
        background: 'white',
      }}
    >
      <h2>{rule.id ? 'Edit Rule' : 'Create Rule'}</h2>

      <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enabled
        </label>

        <label>
          Priority:
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
            style={{ marginLeft: '8px', padding: '4px' }}
          />
        </label>

        <label>
          Match Type:
          <select
            value={matchType}
            onChange={(e) => setMatchType(e.target.value)}
            style={{ marginLeft: '8px', padding: '4px' }}
          >
            <option value="contains">Contains</option>
            <option value="equals">Equals</option>
            <option value="regex">Regex</option>
            <option value="phone">Phone</option>
          </select>
        </label>

        <label>
          Match Value:
          <input
            type="text"
            value={matchValue}
            onChange={(e) => setMatchValue(e.target.value)}
            placeholder="e.g., 'refund' or phone number"
            style={{ marginLeft: '8px', padding: '4px', width: '300px' }}
          />
        </label>

        <h3>Actions:</h3>

        <label>
          Apply Tag ID:
          <input
            type="text"
            value={applyTag}
            onChange={(e) => setApplyTag(e.target.value)}
            placeholder="Tag UUID (optional)"
            style={{ marginLeft: '8px', padding: '4px', width: '300px' }}
          />
        </label>

        <label>
          Set Status:
          <select
            value={setStatus}
            onChange={(e) => setSetStatus(e.target.value)}
            style={{ marginLeft: '8px', padding: '4px' }}
          >
            <option value="">None</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </label>

        <label>
          Assign To (User ID):
          <input
            type="text"
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            placeholder="User UUID (optional)"
            style={{ marginLeft: '8px', padding: '4px', width: '300px' }}
          />
        </label>

        <label>
          Auto-Reply Template ID:
          <input
            type="text"
            value={autoReplyTemplate}
            onChange={(e) => setAutoReplyTemplate(e.target.value)}
            placeholder="Template UUID (optional)"
            style={{ marginLeft: '8px', padding: '4px', width: '300px' }}
          />
        </label>
      </div>

      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '8px 16px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginRight: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            background: '#ccc',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

