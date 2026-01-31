import React from 'react';

interface CTAProps {
    baseUrl: string;
    activeTab: 'sso' | 'minister';
}

const CTA: React.FC<CTAProps> = ({ baseUrl, activeTab }) => {
    return (
        <div className="relative min-h-[400px] flex items-center justify-center text-center bg-[#07253C] overflow-hidden rounded-2xl mx-4 md:mx-0 my-12">
            {/* Background image as overlay */}
            <div
                className="absolute inset-0 bg-center bg-contain bg-no-repeat opacity-30 transform hover:scale-105 transition-transform duration-1000"
                style={{ backgroundImage: `url(${baseUrl}/vote.png)` }}
            />

            {/* Text content */}
            <div className="relative space-y-6 max-w-4xl mx-auto z-10 px-4">
                <h2 className="text-4xl md:text-5xl lg:text-6xl text-white font-bold leading-tight drop-shadow-lg">
                    ยังอยู่ที่เดิม... <br /> หรือจะเปลี่ยนให้ดีขึ้น?
                </h2>
                <div className="inline-block mt-8 group cursor-pointer">
                    <p className="text-lg md:text-xl bg-white text-[#07253C] py-4 px-12 rounded-full font-bold shadow-xl group-hover:bg-blue-50 transition-colors">
                        {activeTab === 'minister' ? (
                            <>8 กุมภา <span className="text-blue-600">เสียงของคุณมีความหมาย</span></>
                        ) : (
                            <>เลือกตั้งประกันสังคม <span className="text-blue-600">เสียงของคุณมีความหมาย</span></>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CTA;
