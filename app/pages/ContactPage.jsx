import React, { useEffect, useState } from 'react';
import { Mail, MessageCircle } from 'lucide-react';

function ContactPage() {
  useEffect(() => {
    document.title = 'Contact Us | PetYupp';
  }, []);

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-3xl mb-3">🐾</div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Contact Us</h1>
          <p className="text-gray-500">We\'d love to hear from you and your dog!</p>
        </div>

        {submitted ? (
          <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-8 text-center">
            <div className="text-3xl mb-3">✉️</div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Message sent!</h3>
            <p className="text-gray-600">We\'ll get back to you within 24 hours.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent outline-none" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent outline-none" placeholder="jane@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                <textarea required rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent outline-none resize-none" placeholder="How can we help?" />
              </div>
              <button type="submit" className="w-full bg-[#06B6D4] hover:bg-[#0891B2] text-white font-bold py-3 rounded-xl transition-colors">
                Send Message →
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="bg-[#F9FAFB] rounded-2xl p-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#06B6D4]/10 rounded-xl flex items-center justify-center">
              <Mail size={18} className="text-[#06B6D4]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Email us at</p>
              <a href="mailto:hello@petyupp.com" className="text-sm font-bold text-gray-900 hover:text-[#06B6D4]">hello@petyupp.com</a>
            </div>
          </div>
          <div className="bg-[#F9FAFB] rounded-2xl p-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#10B981]/10 rounded-xl flex items-center justify-center">
              <MessageCircle size={18} className="text-[#10B981]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Response time</p>
              <p className="text-sm font-bold text-gray-900">Within 24 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ContactPage;
