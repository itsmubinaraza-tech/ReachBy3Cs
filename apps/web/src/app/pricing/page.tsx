'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();

  const handleTryDemo = () => {
    const trialData = localStorage.getItem('reachby3cs_trial');
    const trial = trialData ? JSON.parse(trialData) : { uses: 0, startedAt: new Date().toISOString() };

    if (trial.uses < 10) {
      trial.uses += 1;
      localStorage.setItem('reachby3cs_trial', JSON.stringify(trial));
      router.push('/dashboard?tour=true');
    } else {
      router.push('/signup?reason=trial_expired');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">3C</span>
              </div>
              <span className="font-bold text-xl">ReachBy3Cs</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-gray-600 hover:text-gray-900 transition">Features</Link>
              <Link href="/#how-it-works" className="text-gray-600 hover:text-gray-900 transition">How It Works</Link>
              <Link href="/pricing" className="text-blue-600 font-medium">Pricing</Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition"
              >
                Sign In
              </Link>
              <button
                onClick={handleTryDemo}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Try Free Demo
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your engagement needs. All plans include a 14-day free trial.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
                <p className="text-gray-600 text-sm">Perfect for solopreneurs and small businesses testing AI engagement</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$49</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  '500 AI-generated responses/month',
                  '1,000 post detections/month',
                  '1 project',
                  '3 search configurations',
                  'Reddit & Quora platforms',
                  'Manual posting workflow',
                  'Basic analytics dashboard',
                  'Email support',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleTryDemo}
                className="w-full py-3 px-6 rounded-xl font-semibold border-2 border-gray-200 text-gray-700 hover:border-blue-600 hover:text-blue-600 transition"
              >
                Start Free Trial
              </button>
            </div>

            {/* Professional Plan - Most Popular */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-blue-600 flex flex-col relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Professional</h3>
                <p className="text-gray-600 text-sm">For growing businesses ready to scale their engagement</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$149</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  '2,500 AI-generated responses/month',
                  '10,000 post detections/month',
                  '5 projects',
                  '10 search configurations per project',
                  'Reddit, Quora, Twitter/X, LinkedIn',
                  'Auto-post for low-risk responses',
                  'Advanced analytics & reporting',
                  'Community clustering & insights',
                  'API access',
                  'Priority email & chat support',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleTryDemo}
                className="w-full py-3 px-6 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"
              >
                Start Free Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <p className="text-gray-600 text-sm">For large organizations with custom needs and high volume</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$399</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  '10,000 AI-generated responses/month',
                  '50,000 post detections/month',
                  'Unlimited projects',
                  'Unlimited search configurations',
                  'All platforms + custom integrations',
                  'Advanced auto-post with custom rules',
                  'Custom AI model fine-tuning',
                  'White-label options',
                  'Dedicated account manager',
                  '99.9% uptime SLA',
                  'Phone & video support',
                  'Custom onboarding & training',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=enterprise"
                className="w-full py-3 px-6 rounded-xl font-semibold border-2 border-gray-200 text-gray-700 hover:border-purple-600 hover:text-purple-600 transition text-center block"
              >
                Contact Sales
              </Link>
            </div>
          </div>

          {/* Cost Breakdown Note */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              Pricing includes AI processing (GPT-4 powered responses), real-time platform monitoring via SerpAPI,
              and all infrastructure costs. No hidden fees. Overages billed at standard rates.
            </p>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-3xl mx-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">Common Questions</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="font-medium text-gray-900 mb-1">What counts as a response?</p>
                <p className="text-gray-600">Each AI-generated response to a detected post counts as one response, regardless of response variants.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Can I upgrade or downgrade?</p>
                <p className="text-gray-600">Yes, you can change plans anytime. Changes take effect on your next billing cycle.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">What happens if I exceed limits?</p>
                <p className="text-gray-600">We&apos;ll notify you at 80% usage. Overages are billed at $0.05/response and $0.01/detection.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Is there a free trial?</p>
                <p className="text-gray-600">Yes! All plans include a 14-day free trial with full access. No credit card required to start.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your free trial today. No credit card required.
          </p>
          <button
            onClick={handleTryDemo}
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition shadow-lg"
          >
            Start Free Trial
          </button>
          <p className="mt-6 text-blue-200 text-sm">
            Join 500+ businesses already using ReachBy3Cs
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">3C</span>
              </div>
              <span className="font-bold text-xl text-white">ReachBy3Cs</span>
            </Link>
            <div className="flex items-center gap-8 text-gray-400">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>
            <p className="text-gray-500 text-sm">
              &copy; 2026 ReachBy3Cs. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
