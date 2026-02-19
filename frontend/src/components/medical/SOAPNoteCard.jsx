import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Copy, 
  Download, 
  Edit2, 
  Check,
  FileText,
} from 'lucide-react'
import { cn, copyToClipboard } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * SOAPNoteCard - Display and edit SOAP notes
 * FIXED: Converts nested backend format to simple strings
 */
export function SOAPNoteCard({
  soapNote,
  editable = false,
  onUpdate,
  className
}) {
  // Convert backend's nested format to simple text format
  const convertToSimpleFormat = (note) => {
    if (!note) return { subjective: '', objective: '', assessment: '', plan: '' }
    
    const converted = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    }
    
    // Handle Subjective
    if (note.subjective) {
      if (typeof note.subjective === 'string') {
        converted.subjective = note.subjective
      } else if (typeof note.subjective === 'object') {
        const parts = []
        if (note.subjective.chief_complaint) {
          parts.push(`Chief Complaint: ${note.subjective.chief_complaint}`)
        }
        if (note.subjective.narrative) {
          parts.push(note.subjective.narrative)
        }
        if (Array.isArray(note.subjective.symptoms)) {
          parts.push(`Symptoms: ${note.subjective.symptoms.join(', ')}`)
        }
        converted.subjective = parts.join('\n\n')
      }
    }
    
    // Handle Objective
    if (note.objective) {
      if (typeof note.objective === 'string') {
        converted.objective = note.objective
      } else if (typeof note.objective === 'object') {
        const parts = []
        if (note.objective.vital_signs) {
          parts.push(`Vital Signs: ${note.objective.vital_signs}`)
        }
        if (note.objective.physical_exam) {
          parts.push(`Physical Exam: ${note.objective.physical_exam}`)
        }
        if (note.objective.narrative) {
          parts.push(note.objective.narrative)
        }
        converted.objective = parts.join('\n\n')
      }
    }
    
    // Handle Assessment
    if (note.assessment) {
      if (typeof note.assessment === 'string') {
        converted.assessment = note.assessment
      } else if (typeof note.assessment === 'object') {
        const parts = []
        if (note.assessment.diagnosis) {
          parts.push(`Diagnosis: ${note.assessment.diagnosis}`)
        }
        if (note.assessment.narrative) {
          parts.push(note.assessment.narrative)
        }
        converted.assessment = parts.join('\n\n')
      }
    }
    
    // Handle Plan
    if (note.plan) {
      if (typeof note.plan === 'string') {
        converted.plan = note.plan
      } else if (typeof note.plan === 'object') {
        const parts = []
        if (Array.isArray(note.plan.medications)) {
          parts.push(`Medications: ${note.plan.medications.join(', ')}`)
        }
        if (Array.isArray(note.plan.procedures)) {
          parts.push(`Procedures: ${note.plan.procedures.join(', ')}`)
        }
        if (note.plan.follow_up) {
          parts.push(`Follow-up: ${note.plan.follow_up}`)
        }
        if (note.plan.narrative) {
          parts.push(note.plan.narrative)
        }
        converted.plan = parts.join('\n\n')
      }
    }
    
    return converted
  }

  const [isEditing, setIsEditing] = useState(false)
  const [editedNote, setEditedNote] = useState(() => convertToSimpleFormat(soapNote))

  const sections = [
    {
      key: 'subjective',
      title: 'Subjective',
      description: 'Patient-reported information',
      color: 'bg-blue-50 border-blue-200',
      headerColor: 'bg-blue-100 text-blue-900',
      icon: '👤'
    },
    {
      key: 'objective',
      title: 'Objective',
      description: 'Observable findings and measurements',
      color: 'bg-green-50 border-green-200',
      headerColor: 'bg-green-100 text-green-900',
      icon: '📊'
    },
    {
      key: 'assessment',
      title: 'Assessment',
      description: 'Clinical diagnosis and analysis',
      color: 'bg-purple-50 border-purple-200',
      headerColor: 'bg-purple-100 text-purple-900',
      icon: '🔍'
    },
    {
      key: 'plan',
      title: 'Plan',
      description: 'Treatment plan and next steps',
      color: 'bg-orange-50 border-orange-200',
      headerColor: 'bg-orange-100 text-orange-900',
      icon: '📋'
    }
  ]

  const copySection = async (sectionKey, sectionTitle) => {
    const text = editedNote[sectionKey] || ''
    const success = await copyToClipboard(text)
    if (success) {
      alert(`${sectionTitle} section copied to clipboard`)
    }
  }

  const copyEntireNote = async () => {
    const fullNote = sections
      .map(section => {
        const content = editedNote[section.key] || 'N/A'
        return `${section.title.toUpperCase()}:\n${content}\n`
      })
      .join('\n')
    
    const success = await copyToClipboard(fullNote)
    if (success) {
      alert('Entire SOAP note copied to clipboard')
    }
  }

  const downloadNote = () => {
    const fullNote = sections
      .map(section => {
        const content = editedNote[section.key] || 'N/A'
        return `${section.title.toUpperCase()}:\n${content}\n`
      })
      .join('\n')
    
    const blob = new Blob([fullNote], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `soap-note-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const saveEdits = () => {
    setIsEditing(false)
    if (onUpdate) {
      onUpdate(editedNote)
    }
  }

  const cancelEdits = () => {
    setIsEditing(false)
    setEditedNote(convertToSimpleFormat(soapNote))
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5" />
            SOAP Note
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {editable && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            
            {isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEdits}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={saveEdits}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            )}
            
            {!isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyEntireNote}
                  title="Copy entire note"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadNote}
                  title="Download as text"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {sections.map((section, index) => (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={cn('border-b last:border-b-0', section.color)}>
              <div className={cn(
                'px-6 py-3 flex items-center justify-between',
                section.headerColor
              )}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{section.icon}</span>
                  <div>
                    <h3 className="font-semibold text-base">
                      {section.title}
                    </h3>
                    <p className="text-xs opacity-70">
                      {section.description}
                    </p>
                  </div>
                </div>
                
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copySection(section.key, section.title)}
                    className="h-8"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                )}
              </div>

              <div className="px-6 py-4">
                {isEditing ? (
                  <textarea
                    value={editedNote[section.key] || ''}
                    onChange={(e) => setEditedNote({
                      ...editedNote,
                      [section.key]: e.target.value
                    })}
                    className={cn(
                      'w-full min-h-[120px] p-3 rounded-md border-2',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      'resize-vertical font-sans text-sm leading-relaxed'
                    )}
                    placeholder={`Enter ${section.title.toLowerCase()} information...`}
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {editedNote[section.key] || (
                        <span className="text-gray-400 italic">
                          No {section.title.toLowerCase()} information available
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}