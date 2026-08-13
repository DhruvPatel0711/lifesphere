import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, EyeOff, FileText, ArrowLeft } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-700 space-y-8">
        
        <Breadcrumbs customItems={[{ label: 'Privacy Policy' }]} />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
                Privacy Policy & Security Standard
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Last updated: August 2026 • Patient Confidentiality Standard
              </p>
            </div>
          </div>

          <Link
            to="/"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* Section 1 */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-500" />
            1. Zero Data-Selling Policy & Encrypted Storage
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            At <strong>LifeSphere</strong>, your personal health records, uploaded diagnostic lab reports, family profiles, and AI chat histories are end-to-end protected. We do not sell, license, or monetize patient medical data to insurance providers, advertisers, or third-party brokers under any circumstances.
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-indigo-500" />
            2. Medical AI Disclaimer
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            The AI-powered Symptom Checker, Nutrition Assistant, Fitness Coach, and Medical Record Summaries provided by LifeSphere are designed solely for informational, educational, and preliminary self-triage purposes. They do not constitute formal medical diagnosis, treatment plans, or clinical prescriptions. Always seek the advice of a qualified physician or registered healthcare provider for acute symptoms.
          </p>
        </div>

        {/* Section 3 */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            3. Patient Rights & Data Erasure
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            You retain 100% ownership of your health records. You may export your diagnostic reports or execute permanent account erasure at any time via your Security & Account Settings. Upon account deletion, all attached family profiles, vaccination logs, and stored medical vaults are permanently purged.
          </p>
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-gray-700 text-center text-xs text-gray-400">
          Have questions regarding our security protocols? Contact our Privacy Compliance Team at <a href="mailto:privacy@healthcare-ai.app" className="text-blue-500 hover:underline">privacy@healthcare-ai.app</a>.
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
