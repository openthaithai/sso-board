import React from 'react';

interface DashboardSectionProps {
    title: string;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ title }) => {
    return (
        <div className="relative w-full min-h-[500px] flex items-center overflow-hidden" style={{
            backgroundColor: 'rgb(10, 53, 87)',
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
        }}>
            <div className="absolute inset-0 pointer-events-none">
                {[
                    { delay: '0s', duration: '3s', rotate: '-25deg', top: '5%', left: '5%', size: 'text-7xl' },
                    { delay: '0.5s', duration: '3.5s', rotate: '35deg', top: '8%', right: '8%', size: 'text-6xl' },
                    { delay: '1.5s', duration: '4.5s', rotate: '15deg', top: '50%', left: '3%', size: 'text-6xl' },
                    { delay: '0.8s', duration: '3.8s', rotate: '-30deg', top: '48%', right: '5%', size: 'text-5xl' },
                    { delay: '1s', duration: '4s', rotate: '-15deg', bottom: '8%', left: '10%', size: 'text-6xl' },
                    { delay: '2s', duration: '3.2s', rotate: '40deg', bottom: '10%', right: '12%', size: 'text-7xl' },
                    { delay: '1.2s', duration: '3.7s', rotate: '-10deg', top: '25%', left: '50%', size: 'text-6xl', translate: '-50%, 0px' },
                    { delay: '0.3s', duration: '4.3s', rotate: '25deg', top: '70%', left: '50%', size: 'text-5xl', translate: '-50%, 0px' },
                ].map((chair, i) => (
                    <div
                        key={i}
                        className={`absolute opacity-20 animate-bounce ${chair.size}`}
                        style={{
                            animationDelay: chair.delay,
                            animationDuration: chair.duration,
                            transform: `${chair.translate ? `translate(${chair.translate}) ` : ''}rotate(${chair.rotate})`,
                            top: chair.top,
                            bottom: chair.bottom,
                            left: chair.left,
                            right: chair.right,
                        }}
                    >
                        🪑
                    </div>
                ))}
            </div>
            <div className="relative z-10 w-full max-w-7xl mx-auto px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    <div className="relative flex items-center justify-center py-16 md:py-24 border-r-0 md:border-r-2 border-white/30">
                        <div className="text-center px-8">
                            <h2 className="text-4xl md:text-5xl lg:text-6xl text-white" style={{ lineHeight: '1.4' }}>{title}</h2>
                        </div>
                    </div>
                    <div className="flex items-center justify-center py-16 md:py-24">
                        <div className="text-center px-8">
                            <p className="text-4xl md:text-5xl lg:text-6xl text-white font-bold"
                                style={{ lineHeight: '1.4' }}>อยู่ตำแหน่งเดิม<br />นานแค่ไหน?</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSection;
