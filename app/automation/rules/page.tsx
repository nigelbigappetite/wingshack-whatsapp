'use client'

import { useState, useEffect } from 'react'
import { RuleEditor } from './components/RuleEditor'

interface Rule {
  id: string
  enabled: boolean
  priority: number
  match_type: string
  match_value: string
  actions_json: any
  created_at: string
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/automation/rules')
      const data = await response.json()
      if (response.ok) {
        setRules(data.rules || [])
      }
    } catch (error) {
      console.error('Error fetching rules:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    try {
      const response = await fetch(`/api/automation/rules/${ruleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchRules()
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  if (loading) {
    return <div>Loading rules...</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Automation Rules</h1>
      
      <button
        onClick={() => setEditingRule({} as Rule)}
        style={{
          padding: '10px 20px',
          background: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        Create New Rule
      </button>

      {editingRule && (
        <RuleEditor
          rule={editingRule}
          onSave={() => {
            setEditingRule(null)
            fetchRules()
          }}
          onCancel={() => setEditingRule(null)}
        />
      )}

      <div style={{ display: 'grid', gap: '16px' }}>
        {rules.map((rule) => (
          <div
            key={rule.id}
            style={{
              padding: '16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              background: rule.enabled ? 'white' : '#f5f5f5',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>
                  {rule.match_type}: {rule.match_value}
                  {!rule.enabled && <span style={{ color: '#999', marginLeft: '8px' }}>(Disabled)</span>}
                </h3>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  Priority: {rule.priority}
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                  Actions: {JSON.stringify(rule.actions_json)}
                </div>
              </div>
              <div>
                <button
                  onClick={() => setEditingRule(rule)}
                  style={{ marginRight: '8px', padding: '6px 12px' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  style={{ padding: '6px 12px', background: '#f44336', color: 'white', border: 'none' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

