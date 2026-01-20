import { useState } from 'react'
import { Download, Calendar, Edit2, Save, X, Copy, Check } from 'lucide-react'

function SOAPNoteView({ soapNote }) {
  // State for editing mode for each section
  const [editingSection, setEditingSection] = useState(null)
  
  // State to store edited content (starts with original SOAP note)
  const [editedSoapNote, setEditedSoapNote] = useState(soapNote)
  
  // State for section being edited (temporary storage while editing)
  const [tempEditContent, setTempEditContent] = useState('')
  
  // State for copy feedback
  const [copiedSection, setCopiedSection] = useState(null)
  const [copiedFull, setCopiedFull] = useState(false)

  if (!soapNote) return null

  // Handle starting edit mode for a section
  const handleEditStart = (sectionName) => {
    setEditingSection(sectionName)
    // Convert section content to string for editing
    setTempEditContent(formatSectionForEdit(editedSoapNote[sectionName]))
  }

  // Handle saving edited content
  const handleSave = (sectionName) => {
    setEditedSoapNote({
      ...editedSoapNote,
      [sectionName]: tempEditContent
    })
    setEditingSection(null)
    setTempEditContent('')
  }

  // Handle canceling edit
  const handleCancel = () => {
    setEditingSection(null)
    setTempEditContent('')
  }

  // Format section content as string for editing
  const formatSectionForEdit = (content) => {
    if (typeof content === 'string') {
      return content
    }
    
    if (typeof content === 'object' && content !== null) {
      let text = ''
      Object.entries(content).forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        if (Array.isArray(value)) {
          text += `${label}:\n`
          value.forEach(item => text += `- ${item}\n`)
        } else {
          text += `${label}: ${value}\n`
        }
        text += '\n'
      })
      return text.trim()
    }
    
    return ''
  }

  // Copy individual section to clipboard
  const handleCopySection = async (sectionName) => {
    const content = formatSectionForEdit(editedSoapNote[sectionName])
    const sectionTitle = sectionName.toUpperCase()
    const textToCopy = `${sectionTitle}\n${'='.repeat(50)}\n${content}`
    
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopiedSection(sectionName)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Copy entire SOAP note to clipboard
  const handleCopyFull = async () => {
    const soapText = formatFullSOAPNote(editedSoapNote)
    
    try {
      await navigator.clipboard.writeText(soapText)
      setCopiedFull(true)
      setTimeout(() => setCopiedFull(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Format full SOAP note for copying/downloading
  const formatFullSOAPNote = (note) => {
    const formatSection = (title, content) => {
      let text = `${title.toUpperCase()}\n${'='.repeat(50)}\n`
      
      if (typeof content === 'string') {
        text += content + '\n\n'
      } else if (typeof content === 'object') {
        Object.entries(content).forEach(([key, value]) => {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          if (Array.isArray(value)) {
            text += `${label}:\n`
            value.forEach(item => text += `  - ${item}\n`)
          } else {
            text += `${label}: ${value}\n`
          }
        })
        text += '\n'
      }
      
      return text
    }

    return `
MEDISCRIBE AI - SOAP NOTE
${'='.repeat(50)}
Generated: ${note.generated_at || new Date().toISOString()}

${formatSection('Subjective', note.subjective)}
${formatSection('Objective', note.objective)}
${formatSection('Assessment', note.assessment)}
${formatSection('Plan', note.plan)}

${'='.repeat(50)}
End of SOAP Note
    `.trim()
  }

  // Download SOAP note
  const handleDownload = () => {
    const soapText = formatFullSOAPNote(editedSoapNote)

    const blob = new Blob([soapText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `soap-note-${timestamp}.txt`
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Render content in view mode
  const renderContent = (content) => {
    if (typeof content === 'string') {
      return <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{content}</p>
    }
    
    if (typeof content === 'object' && content !== null) {
      return (
        <div className="space-y-2">
          {Object.entries(content).map(([key, value]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            
            if (Array.isArray(value)) {
              return (
                <div key={key}>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base mb-1">{label}:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {value.map((item, idx) => (
                      <li key={idx} className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{item}</li>
                    ))}
                  </ul>
                </div>
              )
            }
            
            return (
              <p key={key} className="text-sm sm:text-base">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{label}:</span>{' '}
                <span className="text-gray-700 dark:text-gray-300">{value}</span>
              </p>
            )
          })}
        </div>
      )
    }
    
    return null
  }

  // Render section with edit/view toggle
  const renderSection = (sectionName, bgColor, borderColor, textColor, darkBgColor, darkBorderColor, darkTextColor) => {
    const isEditing = editingSection === sectionName
    const isCopied = copiedSection === sectionName

    return (
      <div className={`${bgColor} ${darkBgColor} border-l-4 ${borderColor} ${darkBorderColor} p-3 sm:p-4 rounded-r-lg transition-all ${isEditing ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-base sm:text-lg font-semibold ${textColor} ${darkTextColor}`}>
            {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}
          </h3>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => handleSave(sectionName)}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors"
                  title="Save changes"
                >
                  <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors"
                  title="Cancel editing"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Cancel</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleCopySection(sectionName)}
                  className={`flex items-center gap-1 ${isCopied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors`}
                  title="Copy section"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleEditStart(sectionName)}
                  className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors"
                  title="Edit section"
                >
                  <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <textarea
            value={tempEditContent}
            onChange={(e) => setTempEditContent(e.target.value)}
            className="w-full min-h-32 sm:min-h-40 p-3 border-2 border-blue-300 dark:border-blue-600 rounded-lg text-sm sm:text-base text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
            placeholder={`Edit ${sectionName} content here...`}
            autoFocus
          />
        ) : (
          renderContent(editedSoapNote[sectionName])
        )}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
          SOAP Note
          {editingSection && (
            <span className="ml-2 text-sm text-blue-600 dark:text-blue-400 font-normal">
              (Editing {editingSection})
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          {soapNote.generated_at && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{new Date(soapNote.generated_at).toLocaleString()}</span>
            </div>
          )}
          <button
            onClick={handleCopyFull}
            className={`flex items-center gap-2 ${copiedFull ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'} text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium`}
            title="Copy entire SOAP note"
          >
            {copiedFull ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copy All</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium"
            title="Download SOAP note as text file"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Subjective */}
        {renderSection('subjective', 'bg-blue-50', 'border-blue-500', 'text-blue-900', 'dark:bg-blue-900/20', 'dark:border-blue-400', 'dark:text-blue-300')}

        {/* Objective */}
        {renderSection('objective', 'bg-green-50', 'border-green-500', 'text-green-900', 'dark:bg-green-900/20', 'dark:border-green-400', 'dark:text-green-300')}

        {/* Assessment */}
        {renderSection('assessment', 'bg-yellow-50', 'border-yellow-500', 'text-yellow-900', 'dark:bg-yellow-900/20', 'dark:border-yellow-400', 'dark:text-yellow-300')}

        {/* Plan */}
        {renderSection('plan', 'bg-purple-50', 'border-purple-500', 'text-purple-900', 'dark:bg-purple-900/20', 'dark:border-purple-400', 'dark:text-purple-300')}
      </div>

      {editingSection && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
          <p className="font-medium mb-1">Editing Tips:</p>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
            <li>Edit the content directly in the text area above</li>
            <li>Click Save to keep your changes, or Cancel to discard</li>
            <li>Your edits will be included in the downloaded file</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default SOAPNoteView