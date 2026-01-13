import { Download, Calendar } from 'lucide-react'

function SOAPNoteView({ soapNote }) {
  if (!soapNote) return null

  const handleDownload = () => {
    // Format the SOAP note as text
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

    const soapText = `
MEDISCRIBE AI - SOAP NOTE
${'='.repeat(50)}
Generated: ${soapNote.generated_at || new Date().toISOString()}

${formatSection('Subjective', soapNote.subjective)}
${formatSection('Objective', soapNote.objective)}
${formatSection('Assessment', soapNote.assessment)}
${formatSection('Plan', soapNote.plan)}

${'='.repeat(50)}
End of SOAP Note
    `.trim()

    // Create blob and download
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

  const renderContent = (content) => {
    if (typeof content === 'string') {
      return <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{content}</p>
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
          SOAP Note
        </h2>
        <div className="flex items-center gap-3">
          {soapNote.generated_at && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{new Date(soapNote.generated_at).toLocaleString()}</span>
            </div>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Subjective */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-3 sm:p-4 rounded-r-lg transition-colors">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Subjective
          </h3>
          {renderContent(soapNote.subjective)}
        </div>

        {/* Objective */}
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 p-3 sm:p-4 rounded-r-lg transition-colors">
          <h3 className="text-base sm:text-lg font-semibold text-green-900 dark:text-green-300 mb-2">
            Objective
          </h3>
          {renderContent(soapNote.objective)}
        </div>

        {/* Assessment */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-3 sm:p-4 rounded-r-lg transition-colors">
          <h3 className="text-base sm:text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
            Assessment
          </h3>
          {renderContent(soapNote.assessment)}
        </div>

        {/* Plan */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 dark:border-purple-400 p-3 sm:p-4 rounded-r-lg transition-colors">
          <h3 className="text-base sm:text-lg font-semibold text-purple-900 dark:text-purple-300 mb-2">
            Plan
          </h3>
          {renderContent(soapNote.plan)}
        </div>
      </div>
    </div>
  )
}

export default SOAPNoteView