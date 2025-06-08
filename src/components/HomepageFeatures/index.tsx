import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Accessible by design',
    Svg: require('@site/static/img/undraw_road-to-knowledge_f9zn.svg').default,
    description: (
      <>
        Alliage doesn't drown you in complex patterns or overwhelming concepts. 
        It provides all the tools to follow best practices like SOLID principles 
        and clean architecture, but makes them feel natural and effortless.
      </>
    ),
  },
  {
    title: 'Testing-driven from the ground up',
    Svg: require('@site/static/img/undraw_scientist_5td0.svg').default,
    description: (
      <>
        Testing isn't an afterthought—it's built into Alliage's DNA. Dependency 
        injection makes each piece of code independent and easily testable, while 
        our sandbox environment lets you run integration tests in complete isolation.
      </>
    ),
  },
  {
    title: 'Configuration that just works',
    Svg: require('@site/static/img/undraw_active-options_et7o.svg').default,
    description: (
      <>
        Keep your configuration outside your code where it belongs, while making 
        it seamlessly permeable to different environments. No more hardcoded 
        values or configuration chaos.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
