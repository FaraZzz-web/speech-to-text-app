import { useState, useRef } from "react";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(""); // Placeholder for Day 4
  const [audioUrl, setAudioUrl] = useState(null);

  // useRef keeps track of the recorder and audio data without re-rendering the UI
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Initialize the MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream);

      // 3. Capture audio chunks as they come in
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // 4. When recording stops, package the chunks into a single Blob
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Create a temporary local URL so we can play it back in the UI
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Clear the chunks for the next recording session
        audioChunksRef.current = [];
      };

      // Start the actual recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access is required to use this application.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Stop the recorder
      mediaRecorderRef.current.stop();

      // Stop all microphone tracks to turn off the red recording dot in the browser tab
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());

      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
      {/* Header */}
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          Speech-to-Text Transcriber
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Record your voice and generate real-time transcripts.
        </p>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-40 h-40 rounded-full flex items-center justify-center text-white font-bold text-xl transition-all shadow-lg hover:scale-105 ${
              isRecording
                ? "bg-red-500 animate-pulse hover:bg-red-600"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isRecording ? "Stop" : "Start"}
          </button>

          {/* Local Audio Playback Verification */}
          {audioUrl && !isRecording && (
            <div className="mt-4 flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-2">
                Recorded Audio (Local Blob):
              </p>
              <audio src={audioUrl} controls className="outline-none" />
            </div>
          )}
        </div>
      </div>

      {/* Transcript Area */}
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-md p-6 h-64 flex flex-col">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Transcript</h2>
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-y-auto">
          {transcript ? (
            <p className="text-gray-800">{transcript}</p>
          ) : (
            <p className="text-gray-400 italic">
              Your transcribed text will appear here...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
