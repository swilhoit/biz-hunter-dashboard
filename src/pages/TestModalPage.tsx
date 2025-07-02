import React, { useState } from 'react';

function TestModalPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Modal Test Page</h1>
      <p className="mb-4">Current state: showModal = {showModal ? 'TRUE' : 'FALSE'}</p>
      
      <button
        onClick={() => {
          console.log('Button clicked, current showModal:', showModal);
          setShowModal(!showModal);
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Toggle Modal
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">Test Modal</h2>
            <p className="mb-4">If you see this, modals work!</p>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestModalPage;