/**
 * SOAPNoteView Component
 * Displays formatted SOAP note (Subjective, Objective, Assessment, Plan)
 * 
 * Props:
 * - soapNote: Object containing SOAP note sections
 */
function SOAPNoteView({ soapNote }) {
  if (!soapNote) return null;

  // Render a SOAP section with styled header
  const renderSection = (title, content, bgColor) => (
    <div className="mb-6">
      <div className={`${bgColor} px-4 py-2 rounded-t-lg`}>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      </div>
      <div className="bg-white border-2 border-t-0 border-gray-200 rounded-b-lg p-4">
        {renderSectionContent(content)}
      </div>
    </div>
  );

  // Render section content based on structure
  const renderSectionContent = (content) => {
    if (!content) return <p className="text-gray-500 italic">No information available</p>;

    if (typeof content === 'string') {
      return <p className="text-gray-700">{content}</p>;
    }

    if (typeof content === 'object') {
      return (
        <div className="space-y-3">
          {Object.entries(content).map(([key, value]) => (
            <div key={key}>
              <p className="font-semibold text-gray-800 mb-1">
                {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
              </p>
              {Array.isArray(value) ? (
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {value.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700">{value}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">SOAP Note</h2>

      {/* Subjective Section */}
      {renderSection('Subjective', soapNote.subjective, 'bg-blue-100')}

      {/* Objective Section */}
      {renderSection('Objective', soapNote.objective, 'bg-green-100')}

      {/* Assessment Section */}
      {renderSection('Assessment', soapNote.assessment, 'bg-yellow-100')}

      {/* Plan Section */}
      {renderSection('Plan', soapNote.plan, 'bg-purple-100')}

      {/* Timestamp */}
      {soapNote.generated_at && (
        <div className="mt-6 text-sm text-gray-500 text-right">
          Generated: {new Date(soapNote.generated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default SOAPNoteView;