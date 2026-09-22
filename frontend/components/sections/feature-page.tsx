import { MotionReveal } from "@/components/layout/motion-reveal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PageFeature, StatCard } from "@/types/domain";

interface FeaturePageProps {
  eyebrow: string;
  title: string;
  description: string;
  features: PageFeature[];
  stats?: StatCard[];
}

export function FeaturePage({
  eyebrow,
  title,
  description,
  features,
  stats = []
}: FeaturePageProps) {
  return (
    <div className="space-y-8">
      <MotionReveal>
        <section className="rounded-[2rem] border border-border/70 bg-card/90 px-6 py-12 shadow-soft">
          <Badge>{eyebrow}</Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            {description}
          </p>
        </section>
      </MotionReveal>

      {stats.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
              </CardHeader>
              {stat.helper ? <CardContent>{stat.helper}</CardContent> : null}
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
