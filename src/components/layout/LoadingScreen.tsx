import { BrandMark } from '../common/Brand';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <BrandMark className="w-16 h-16 z-10 relative" />
          <div className="absolute inset-0 bg-teal-500 rounded-2xl animate-ping opacity-20" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="text-teal-600 font-bold uppercase tracking-widest text-xs animate-pulse">
            Decrypting Vault...
          </div>
        </div>
      </div>
    </div>
  );
}
