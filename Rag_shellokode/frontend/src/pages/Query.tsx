// src/pages/Query.tsx - FINAL VERSION: Clear Chat, Toggle Speech, Copy, Charts, Fixed Icons

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, Mic, MicOff, Speaker, VolumeX, Copy, Check, Trash2, BarChart2 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  chartData?: any;
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut';
}

const Query: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const recognitionRef = useRef<any>(null);
  const token = localStorage.getItem('token');

  // Clear all chat instantly
  const clearChat = () => {
    setMessages([]);
    setInput('');
    setLoading(false);
    setListening(false);
    setSpeakingMessageId(null);
    setCopiedId(null);

    // Stop any ongoing speech or voice recognition
    if (recognitionRef.current) recognitionRef.current.stop();
    speechSynthesis.cancel();

    setMessage({ type: 'success', text: 'Chat cleared! Start a fresh conversation.' });
  };

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onerror = () => {
        setListening(false);
        setMessage({ type: 'error', text: 'Voice recognition error' });
      };

      recognitionRef.current.onend = () => {
        setListening(false);
      };

      return () => {
        recognitionRef.current?.stop();
      };
    }
  }, []);

  // Auto-stop speech when new message arrives
  useEffect(() => {
    if (speakingMessageId) {
      speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }
  }, [messages.length]);

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setListening(!listening);
  };

  const toggleSpeech = (text: string, messageId: string) => {
    if (speakingMessageId === messageId) {
      speechSynthesis.cancel();
      setSpeakingMessageId(null);
    } else {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => {
        setSpeakingMessageId(null);
        setMessage({ type: 'error', text: 'Speech playback failed' });
      };

      speechSynthesis.speak(utterance);
      setSpeakingMessageId(messageId);
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to copy' });
    }
  };

  const detectChartRequest = (question: string): { type?: string } => {
    const lower = question.toLowerCase();
    if (lower.includes('chart') || lower.includes('graph') || lower.includes('visualize') || lower.includes('show me in') || lower.includes('visualization')) {
      if (lower.includes('pie') || lower.includes('doughnut') || lower.includes('distribution') || lower.includes('percentage') || lower.includes('share')) return { type: 'pie' };
      if (lower.includes('trend') || lower.includes('over time') || lower.includes('timeline') || lower.includes('progression')) return { type: 'line' };
      if (lower.includes('compare') || lower.includes('versus') || lower.includes('vs') || lower.includes('comparison')) return { type: 'bar' };
      return { type: 'bar' };
    }
    return {};
  };

  const extractChartConfig = (answer: string) => {
    const jsonBlockMatch = answer.match(/```(?:json)?\s*({[\s\S]*?})\s*```/i);
    if (jsonBlockMatch) {
      try {
        return JSON.parse(jsonBlockMatch[1].trim());
      } catch (e) {
        console.error('JSON block parse error:', e);
      }
    }

    const jsonMatches = answer.match(/\{[^{}]*"type"[^{}]*"data"[^{}]*\}/i);
    if (jsonMatches) {
      try {
        return JSON.parse(jsonMatches[0]);
      } catch (e) {
        console.error('Inline JSON parse error:', e);
      }
    }

    return null;
  };

  const handleSend = async () => {
    if (!input.trim() || !token) return;

    const userMsg: Message = { id: Date.now().toString(), content: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const chartRequest = detectChartRequest(input);

    try {
      const res = await fetch('https://typehype.onrender.com/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: input })
      });

      const data = await res.json();
      let answer = data.answer || "No answer received.";

      let chartConfig = null;
      let chartType = chartRequest.type;

      if (chartRequest.type) {
        chartConfig = extractChartConfig(answer);

        if (chartConfig) {
          chartType = chartConfig.type || chartType;
          answer = answer.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, '').trim();
          answer = answer.replace(/\{[\s\S]*?\}/g, '').trim();
          answer = answer.replace(/\n\s*\n/g, '\n').trim();
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: answer || 'Here is your visualization:',
        sender: 'assistant',
        chartData: chartConfig?.data || chartConfig,
        chartType: chartType as any
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Data Visualization', font: { size: 18 } }
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-sm md:text-lg lg:text-xl">
      {/* Header with Title and Clear Chat Button */}
      <div className="bg-white shadow-md p-4 md:p-6 border-b flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <BarChart2 className="h-8 w-8 text-gray-800" /> Ask Your Documents
        </h1>

        <button
          onClick={clearChat}
          className="p-3 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition shadow-md"
          title="Clear chat and start fresh"
        >
          <Trash2 className="h-6 w-6" />
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <Bot className="mx-auto h-24 w-24 text-gray-300 mb-6" />
              <p className="text-xl md:text-2xl text-gray-600">Start asking questions about your uploaded documents!</p>
              <p className="text-lg text-gray-500 mt-4">
                Try: "Show me a pie chart of sales by region" or "Compare monthly revenue in a bar chart"
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`relative max-w-3xl w-full px-6 py-4 rounded-3xl shadow-xl ${msg.sender === 'user' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'}`}>
                <p className="whitespace-pre-wrap text-lg leading-relaxed">{msg.content}</p>

                {msg.chartData && msg.chartType && (
                  <div className="mt-6 p-6 bg-gray-50 rounded-2xl border">
                    <div className="h-96">
                      {msg.chartType === 'bar' && <Bar options={chartOptions} data={msg.chartData} />}
                      {msg.chartType === 'line' && <Line options={chartOptions} data={msg.chartData} />}
                      {msg.chartType === 'pie' && <Pie options={chartOptions} data={msg.chartData} />}
                      {msg.chartType === 'doughnut' && <Doughnut options={chartOptions} data={msg.chartData} />}
                    </div>
                  </div>
                )}

                {msg.sender === 'assistant' && (
                  <div className="absolute -bottom-4 right-4 flex gap-3">
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition"
                      title="Copy text"
                    >
                      {copiedId === msg.id ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>

                    <button
                      onClick={() => toggleSpeech(msg.content, msg.id)}
                      className={`p-3 rounded-full shadow-lg transition hover:scale-110 ${
                        speakingMessageId === msg.id ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
                      }`}
                      title={speakingMessageId === msg.id ? 'Stop reading' : 'Read aloud'}
                    >
                      {speakingMessageId === msg.id ? <VolumeX className="h-5 w-5" /> : <Speaker className="h-5 w-5" />}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-6 py-4 rounded-3xl shadow-xl">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-gray-600 rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-gray-600 rounded-full animate-bounce delay-100" />
                  <div className="w-3 h-3 bg-gray-600 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Bar */}
      <div className="border-t bg-white p-4 md:p-6">
        <div className="max-w-5xl mx-auto flex gap-4 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
            placeholder="Ask about your documents... (try asking for charts!)"
            className="flex-1 px-6 py-4 border border-gray-300 rounded-full focus:outline-none focus:ring-4 focus:ring-gray-300 text-lg"
            disabled={loading}
          />
          <button
            onClick={toggleListening}
            className={`p-4 rounded-full transition ${listening ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-200'}`}
            title={listening ? 'Stop listening' : 'Speak your question'}
          >
            {listening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-8 py-4 bg-gray-900 text-white rounded-full hover:bg-gray-800 disabled:opacity-50 flex items-center gap-3 transition font-medium"
          >
            <Send className="h-5 w-5" />
            Send
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {message && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 pointer-events-none">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-xl shadow-2xl text-center pointer-events-auto"
          >
            <p className={`text-xl font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.type.toUpperCase()}: {message.text}
            </p>
            <button onClick={() => setMessage(null)} className="mt-6 text-gray-600 underline text-lg">
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Query;
