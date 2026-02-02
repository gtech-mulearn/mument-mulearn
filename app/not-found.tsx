import Link from "next/link";
import Image from "next/image";
import Silk from "./components/Silk";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
        <div className="absolute inset-0">
        <Silk
          speed={5}
          scale={1}
          color="#2e85fe"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>
      <div className="text-center px-10 z-50 gap-4 flex flex-col items-center justify-center">
        <Image src="/logo_white.png" alt="Not Found" width={200} height={200} />
        <h1 className="text-7xl lg:text-9xl text-white font-black mb-6">Page not found</h1>
        <Link href="/" className="px-6 py-3 bg-white text-black font-bold rounded-4xl hover:bg-blue-700 hover:text-white">
          Go Home
        </Link>
      </div>
      <footer className="absolute bottom-4 w-full text-center text-white text-sm z-10">
        &copy; {new Date().getFullYear()} µment. All rights reserved.
      </footer>
    </div>
  );
}