import React, { useState } from 'react';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <section className="py-16" style={{ background: '#06B6D4' }}>
      <div className="max-w-2xl mx-auto px-4 text-center">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Join the Pack
        </h2>

        {/* Subtext */}
        <p className="text-white/90 text-base mb-8">
          Get 10% off your first order + tips for a happier dog.
        </p>

        {/* Form or success state */}
        {submitted ? (
          <div className="bg-white/20 rounded-xl px-6 py-4 inline-block">
            <p className="text-white font-semibold text-lg">
              Thanks for joining! Check your inbox.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col md:flex-row gap-0 max-w-md mx-auto"
          >
            {/* Email input */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              required
              className="flex-1 px-5 py-3 rounded-t-lg md:rounded-l-lg md:rounded-tr-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            />

            {/* Subscribe button */}
            <button
              type="submit"
              className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm rounded-b-lg md:rounded-r-lg md:rounded-bl-none hover:bg-gray-800 transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        )}

        {/* Disclaimer */}
        <p className="text-white/70 text-xs mt-4">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
};

export default Newsletter;
