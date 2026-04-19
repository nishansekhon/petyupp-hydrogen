import {Link} from 'react-router';

/**
 * Problem Bundles Component - Featured card + 4 smaller cards
 */
const PROBLEMS = [
  {
    id: 1,
    title: 'Separation Anxiety',
    backgroundImage: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
    link: '/collections',
    featured: true,
  },
  {
    id: 2,
    title: 'Dental Health',
    backgroundImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&q=80',
    link: '/collections/treats',
    featured: false,
  },
  {
    id: 3,
    title: 'Destructive Chewing',
    backgroundImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80',
    link: '/collections/yak-chews',
    featured: false,
  },
  {
    id: 4,
    title: 'Joint Pain',
    backgroundImage: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&q=80',
    link: '/collections/treats',
    featured: false,
  },
  {
    id: 5,
    title: 'Digestive Issues',
    backgroundImage: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80',
    link: '/collections/treats',
    featured: false,
  },
];

export function ProblemBundles() {

  const featuredProblem = PROBLEMS.find((p) => p.featured);
  const otherProblems = PROBLEMS.filter((p) => !p.featured);

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-poppins mb-4">
            What does your dog need relief from?
          </h2>
          <p className="text-xl text-gray-600 font-inter">
            Find natural relief matched to your dog's exact needs
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Featured Card - Left side, spans 2 rows */}
          <Link
            to={featuredProblem.link}
            className="lg:col-span-1 lg:row-span-2 rounded-xl overflow-hidden relative bg-cover bg-center h-72 lg:h-auto hover:scale-105 transition-transform duration-300 cursor-pointer group"
            style={{backgroundImage: `url(${featuredProblem.backgroundImage})`}}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors"></div>
            {/* Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <h3 className="text-3xl font-bold font-poppins text-white text-center">
                {featuredProblem.title}
              </h3>
            </div>
          </Link>

          {/* Smaller Cards Grid - Right side */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {otherProblems.map((problem) => (
              <Link
                key={problem.id}
                to={problem.link}
                className="rounded-xl overflow-hidden relative bg-cover bg-center h-48 hover:scale-105 transition-transform duration-300 cursor-pointer group"
                style={{backgroundImage: `url(${problem.backgroundImage})`}}
              >
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors"></div>
                {/* Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-xl font-bold font-poppins text-white text-center px-4">
                    {problem.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
