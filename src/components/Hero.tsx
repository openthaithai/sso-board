import React from 'react';

interface HeroProps {
    baseUrl: string;
    onScrollClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ baseUrl, onScrollClick }) => {
    return (
        <div className="grid grid-cols-1 relative">
            <img
                src={`${baseUrl}/header_chair.png`}
                alt="Header Background"
                className="col-start-1 row-start-1 w-full h-[calc(105vh)] object-cover object-bottom"
            />
            <div
                className="col-start-1 row-start-1 relative z-10 flex flex-col items-center justify-between h-full pt-24 md:pt-32 pb-8 px-4 text-center">
                <div className="space-y-6 max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl text-white mb-6"
                        style={{ lineHeight: '1.2' }}>ผ่านมากี่ปี<br />เก้าอี้ก็ยังเป็นของคนเดิม</h1>
                    <p className="text-xl md:text-2xl text-gray-200 mb-8">ส่องข้อมูลตำแหน่งเดิมที่ยาวนาน...<br />จนกลายเป็นตำนานองค์กร
                    </p>
                </div>
                <button
                    onClick={onScrollClick}
                    className="flex flex-col items-center gap-2 text-white hover:text-gray-200 transition-colors cursor-pointer animate-bounce"
                    aria-label="Scroll down"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="lucide lucide-chevron-down w-12 h-12" aria-hidden="true">
                        <path d="m6 9 6 6 6-6"></path>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Hero;
