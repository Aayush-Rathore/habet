import DownloadButton from "@/components/shared/DownloadButton";

export default function HeroSection() {
  return (
    <section className="relative w-full h-[600px] md:h-[700px] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/g1-ss5.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Download Buttons at Bottom */}
      <div className="absolute bottom-8 left-0 right-0 z-10 flex flex-col items-center gap-4 px-4">
        <DownloadButton id="hero-download-btn-1" />
        <DownloadButton 
          id="hero-download-btn-2" 
          href="https://web-in.batwingo.com/en/affiliate-invited?c=WNRJ4DF4&s=1"
        />
      </div>
    </section>
  );
}
