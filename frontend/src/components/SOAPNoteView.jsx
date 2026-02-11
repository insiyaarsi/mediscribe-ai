import { useState, useEffect, useRef } from 'react'
import { Download, Calendar, Edit2, Save, X, Copy, Check, HelpCircle, Keyboard, Printer } from 'lucide-react'

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

  // State for keyboard shortcuts help modal
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)

  // Ref for the component container
  const containerRef = useRef(null)

  if (!soapNote) return null

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if we're focused within this component
      if (!containerRef.current?.contains(document.activeElement)) {
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modKey = isMac ? e.metaKey : e.ctrlKey

      // Show shortcuts modal with "?"
      if (e.key === '?' && !e.shiftKey) {
        e.preventDefault()
        setShowShortcutsModal(true)
        return
      }

      // Close modal with Escape
      if (e.key === 'Escape' && showShortcutsModal) {
        e.preventDefault()
        setShowShortcutsModal(false)
        return
      }

      // Cancel editing with Escape
      if (e.key === 'Escape' && editingSection) {
        e.preventDefault()
        handleCancel()
        return
      }

      // Save with Ctrl/Cmd + S
      if (modKey && e.key === 's' && editingSection) {
        e.preventDefault()
        handleSave(editingSection)
        return
      }

      // Download with Ctrl/Cmd + D
      if (modKey && e.key === 'd') {
        e.preventDefault()
        handleDownload()
        return
      }

      // Edit first section with Ctrl/Cmd + E
      if (modKey && e.key === 'e' && !editingSection) {
        e.preventDefault()
        handleEditStart('subjective')
        return
      }

      // Copy all with Ctrl/Cmd + Shift + C
      if (modKey && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        handleCopyFull()
        return
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editingSection, showShortcutsModal, editedSoapNote])

  // Focus container when component mounts to enable shortcuts
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus()
    }
  }, [])

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

  // Print SOAP note
  const handlePrint = () => {
    window.print()
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
      <div className={`soap-section ${bgColor} ${darkBgColor} border-l-4 ${borderColor} ${darkBorderColor} p-3 sm:p-4 rounded-r-lg transition-all ${isEditing ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400' : ''} print:border-l-4 print:rounded-none`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-base sm:text-lg font-semibold ${textColor} ${darkTextColor} print:text-black`}>
            {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}
          </h3>
          <div className="flex items-center gap-2 print:hidden">
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
    <div 
      ref={containerRef}
      tabIndex={0}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300 focus:outline-none relative print-soap-note print:shadow-none print:p-8"
    >
      {/* Keyboard Shortcuts Help Badge */}
      <button
        onClick={() => setShowShortcutsModal(true)}
        className="absolute top-2 right-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors opacity-60 hover:opacity-100 print:hidden"
        title="Show keyboard shortcuts"
      >
        <Keyboard className="w-3 h-3" />
        <span className="hidden sm:inline">Press ? for help</span>
      </button>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowShortcutsModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Keyboard Shortcuts
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-700 dark:text-gray-300">Edit first section</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-mono">
                  {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Cmd' : 'Ctrl'} + E
                </kbd>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-700 dark:text-gray-300">Save changes</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-mono">
                  {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Cmd' : 'Ctrl'} + S
                </kbd>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-700 dark:text-gray-300">Cancel editing</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-mono">
                  Esc
                </kbd>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-700 dark:text-gray-300">Download SOAP note</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-mono">
                  {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Cmd' : 'Ctrl'} + D
                </kbd>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-700 dark:text-gray-300">Copy entire note</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-mono">
                  {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Cmd' : 'Ctrl'} + Shift + C
                </kbd>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Show this help</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-mono">
                  ?
                </kbd>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 mt-8 sm:mt-0 print:mt-0 print-header">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white print:text-black print:text-2xl">
            SOAP Note
            {editingSection && (
              <span className="ml-2 text-sm text-blue-600 dark:text-blue-400 font-normal print:hidden">
                (Editing {editingSection})
              </span>
            )}
          </h2>
          {soapNote.generated_at && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 print:text-black">
              Generated: {new Date(soapNote.generated_at).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap print:hidden">
          <button
            onClick={handleCopyFull}
            className={`flex items-center gap-2 ${copiedFull ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'} text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium print:hidden`}
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
            onClick={handlePrint}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium print:hidden"
            title="Print SOAP note"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium print:hidden"
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