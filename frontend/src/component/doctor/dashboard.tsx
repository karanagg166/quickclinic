import React from 'react';
import { motion } from 'framer-motion';
import SimpleParticleBackground from '../common/SimpleParticleBackground';
import GlassCard from '../common/GlassCard';
import SummaryCards from './SummaryCards';
import DataTable from './DataTable';

const DocDashboard: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Particle Background */}
      <SimpleParticleBackground />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen pt-28 p-6 lg:ml-80">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <SummaryCards />
          <DataTable />
        </motion.div>
      </div>
    </div>
  );
};

export default DocDashboard;
