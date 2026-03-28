import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Target, User, Wallet, Zap } from "lucide-react";

const sections = [
  {
    icon: Zap,
    title: "Our Mission",
    content:
      "To empower individuals with simple, smart, and accessible financial tools that promote better money management and financial growth.",
  },
  {
    icon: Target,
    title: "Our Vision",
    content:
      "To become a leading digital financial solution that helps users build financial discipline, achieve their goals, and create long-term wealth.",
  },
];

export default function About() {
  return (
    <div className="px-4 pt-4 pb-6 space-y-5">
      {/* Hero */}
      <div className="flex flex-col items-center gap-3 py-4">
        <img
          src="/assets/generated/smart-wallet-logo-transparent.dim_200x200.png"
          alt="Smart Wallet Logo"
          className="w-20 h-20 object-contain"
        />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Smart Wallet</h2>
          <p className="text-xs text-primary font-medium tracking-wide uppercase mt-0.5">
            Financial Management
          </p>
        </div>
      </div>

      {/* App Description */}
      <Card className="border-border">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Financial Management is a smart solution designed to help
            individuals take full control of their financial life. The app
            simplifies income tracking, expense management, budgeting, savings,
            and investment tracking — all in one place. It also provides
            insights and smart recommendations to improve financial decisions.
          </p>
        </CardContent>
      </Card>

      {/* Mission & Vision */}
      {sections.map(({ icon: Icon, title, content }) => (
        <Card key={title} className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content}
            </p>
          </CardContent>
        </Card>
      ))}

      {/* Developer */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">
              About the Developer
            </h3>
          </div>
          <div className="bg-primary/5 rounded-lg px-3 py-2 mb-3">
            <p className="text-sm font-semibold text-primary">
              ABUBAKARI RAJABU NALIWILE
            </p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This application was developed by ABUBAKARI RAJABU NALIWILE, a
            student of Agricultural Economics and Agribusiness with a strong
            passion for technology, innovation, and digital solutions. The goal
            is to create impactful tools that solve real-world problems in
            finance and entrepreneurship.
          </p>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Contact</h3>
          </div>
          <div className="space-y-3">
            <a
              href="mailto:naliwilea@gmail.com"
              className="flex items-center gap-3 group"
              data-ocid="about.email.link"
            >
              <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                naliwilea@gmail.com
              </span>
            </a>
            <Separator />
            <a
              href="tel:+255613390612"
              className="flex items-center gap-3 group"
              data-ocid="about.phone.link"
            >
              <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                +255 613 390 612
              </span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
