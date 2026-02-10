import { motion } from "framer-motion";

const LoadingScreen = ({ message = "Loading Clarity..." }: { message?: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-dark-900 overflow-hidden"
        >
            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
            <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-secondary/10 blur-[100px] rounded-full" />

            <div className="relative flex flex-col items-center gap-8">
                {/* Animated Logo Container */}
                <div className="relative">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 90, 180, 270, 360],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        className="w-20 h-20 rounded-2xl border-2 border-primary/30 flex items-center justify-center"
                    >
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20" />
                    </motion.div>

                    {/* Orbiting particles */}
                    {[0, 120, 240].map((angle, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                rotate: 360,
                            }}
                            transition={{
                                duration: 2 + i,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                            className="absolute inset-0"
                        >
                            <div
                                className="w-2 h-2 rounded-full bg-primary/50 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 shadow-[0_0_8px_rgba(45,212,191,0.5)]"
                                style={{ transform: `rotate(${angle}deg)` }}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Text and Progress */}
                <div className="flex flex-col items-center gap-3">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tight"
                    >
                        Clarity
                    </motion.h1>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="h-0.5 w-32 bg-primary/30 rounded-full origin-left overflow-hidden"
                    >
                        <motion.div
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="h-full w-1/2 bg-primary shadow-[0_0_10px_rgba(45,212,191,0.8)]"
                        />
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-xs text-dark-200 font-medium uppercase tracking-[0.2em] mt-2"
                    >
                        {message}
                    </motion.p>
                </div>
            </div>
        </motion.div>
    );
};

export default LoadingScreen;
