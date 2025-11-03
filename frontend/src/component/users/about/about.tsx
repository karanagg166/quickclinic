import React from 'react';
import { motion } from 'framer-motion';
import SimpleParticleBackground from '../../common/SimpleParticleBackground';
import GlassCard from '../../common/GlassCard';
import { Heart, Zap, Shield, Stethoscope, Clock, Users } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <SimpleParticleBackground />
      <div className="relative z-10 min-h-screen pt-28 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard glow className="overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-neon-500/20 to-cyan-500/20 backdrop-blur-sm border-b border-white/20 p-8">
                <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
                  <Stethoscope className="w-10 h-10 text-neon-400" />
                  About QuickClinic
                </h1>
              </div>

              <div className="p-8">
                <div className="space-y-6 mb-8">
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-white/90 leading-relaxed"
                  >
                    QuickClinic is a comprehensive healthcare management platform that connects patients with doctors, 
                    enabling seamless appointment booking, real-time messaging, and payment processing.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-white/90 leading-relaxed"
                  >
                    Our mission is to make healthcare more accessible and convenient for everyone. We provide a 
                    modern, user-friendly platform that streamlines the entire healthcare experience.
                  </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-neon-400/50 transition duration-300"
                  >
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-neon-400/30 to-cyan-400/30 rounded-full flex items-center justify-center border border-neon-400/50">
                        <Heart className="w-8 h-8 text-neon-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">Quality Care</h3>
                    <p className="text-white/70">We ensure the highest standards of medical care.</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-neon-400/50 transition duration-300"
                  >
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-neon-400/30 to-cyan-400/30 rounded-full flex items-center justify-center border border-neon-400/50">
                        <Zap className="w-8 h-8 text-cyan-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">Quick Access</h3>
                    <p className="text-white/70">Fast and easy appointment booking system.</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-neon-400/50 transition duration-300"
                  >
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-neon-400/30 to-cyan-400/30 rounded-full flex items-center justify-center border border-neon-400/50">
                        <Shield className="w-8 h-8 text-neon-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">Secure</h3>
                    <p className="text-white/70">Your data and privacy are our top priority.</p>
                  </motion.div>
                </div>

                {/* Additional Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <Clock className="w-8 h-8 text-neon-400" />
                      <h3 className="text-xl font-semibold bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">24/7 Availability</h3>
                    </div>
                    <p className="text-white/70">Book appointments anytime, anywhere. Our platform is available round the clock for your convenience.</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <Users className="w-8 h-8 text-cyan-400" />
                      <h3 className="text-xl font-semibold bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">Expert Doctors</h3>
                    </div>
                    <p className="text-white/70">Connect with verified and experienced healthcare professionals in your area.</p>
                  </motion.div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;
