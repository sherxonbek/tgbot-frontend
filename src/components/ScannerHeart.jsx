import { HeartIcon } from "../assets/icon"

export function ScannerHeart() {

    const ringStyle = (delay) => ({
        animationDelay: delay,
        animationName: 'scanner-ring',
        animationDuration: '3s',
        animationTimingFunction: 'ease-out',
        animationIterationCount: 'infinite',
    })

    return (
        <>
            <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
                <div
                    className="absolute rounded-full"
                    style={{
                        width: 110,
                        height: 110,
                        background: 'radial-gradient(circle, rgba(124,90,240,0.45) 0%, transparent 70%)',
                        filter: 'blur(18px)',
                    }}
                />
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="absolute rounded-full border"
                        style={{
                            width: 110,
                            height: 110,
                            borderColor: `rgba(167,139,250,${0.6 - i * 0.08})`,
                            ...ringStyle(`${i * 0.75}s`),
                        }}
                    />
                ))}
                <div
                    className="absolute rounded-full spin-slow"
                    style={{
                        width: 200,
                        height: 200,
                        border: '1px dashed rgba(124,90,240,0.3)',
                    }}
                >
                    <div
                        className="absolute rounded-full"
                        style={{
                            width: 7,
                            height: 7,
                            top: -3.5,
                            left: '50%',
                            marginLeft: -3.5,
                            background: '#7c5af0',
                            boxShadow: '0 0 8px #7c5af0',
                        }}
                    />
                </div>
                <div
                    className="absolute rounded-full spin-rev"
                    style={{
                        width: 155,
                        height: 155,
                        border: '1px dashed rgba(167,139,250,0.2)',
                    }}
                >
                    <div
                        className="absolute rounded-full"
                        style={{
                            width: 5,
                            height: 5,
                            bottom: -2.5,
                            left: '50%',
                            marginLeft: -2.5,
                            background: '#a78bfa',
                            boxShadow: '0 0 6px #a78bfa',
                        }}
                    />
                </div>
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute"
                        style={{
                            width: 1,
                            height: i % 3 === 0 ? 10 : 5,
                            background: `rgba(124,90,240,${i % 3 === 0 ? 0.6 : 0.25})`,
                            transformOrigin: '50% 110px',
                            transform: `rotate(${i * 30}deg) translateY(-100px)`,
                        }}
                    />
                ))}
                <div
                    className="heartbeat relative z-10 flex items-center justify-center rounded-full"
                    style={{
                        width: 90,
                        height: 90,
                        background: 'radial-gradient(135deg, #7c5af0 0%, #5b3fd4 100%)',
                        boxShadow: '0 0 32px rgba(124,90,240,0.7), 0 0 64px rgba(124,90,240,0.25)',
                        color: '#fff',
                    }}
                >
                    <HeartIcon />
                </div>
            </div>
        </>
    )
}

export default ScannerHeart