import { useState, useRef, useEffect } from "react";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);

  // --- NEW (Day 6): History State ---
  const [history, setHistory] = useState([]);

  // Fetch history when the app loads
  const fetchHistory = async () => {
    try {
      const response = await fetch("http://localhost:8000/history");
      const result = await response.json();
      if (result.status === "success") {
        setHistory(result.data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  // Run the fetch function once when the component mounts
  useEffect(() => {
    fetchHistory();
  }, []);

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

      // 4. When recording stops, package the chunks and send to backend
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Create a temporary local URL so we can play it back in the UI
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Clear the chunks for the next recording session
        audioChunksRef.current = [];

        // --- NEW (Day 3): Send the file to the FastAPI backend ---
        setTranscript("Uploading to server..."); // Temporary loading state

        const formData = new FormData();
        // Append the blob as a file named "recording.webm"
        formData.append("file", audioBlob, "recording.webm");
        try {
          const response = await fetch("http://localhost:8000/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log("Server response:", data);

          // --- NEW (Day 4): Display the actual text! ---
          if (data.transcript) {
            setTranscript(data.transcript);
            fetchHistory(); // <--- ADD THIS LINE to refresh the list automatically
          } else {
            setTranscript("Audio processed, but no words were detected.");
          }
        } catch (error) {
          console.error("Error uploading file:", error);
          setTranscript("Error: Could not connect to the backend server.");
        }
      };

      // Start the actual recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscript("Listening..."); // UI feedback while recording
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
      {/* --- NEW (Day 6): History Area --- */}
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-md p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Past Transcripts
        </h2>
        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-2">
          {history.length === 0 ? (
            <p className="text-gray-400 italic text-center">
              No past transcripts found.
            </p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
              >
                <p className="text-gray-800">{item.text}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
