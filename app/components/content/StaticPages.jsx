import {Link} from 'react-router';

const Container = ({children}) => (
  <div className="max-w-4xl mx-auto px-4 py-12">{children}</div>
);

const Heading = ({children}) => (
  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
    {children}
  </h1>
);

const Subheading = ({children}) => (
  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-10 mb-4">
    {children}
  </h2>
);

const TealCTA = ({to, children}) => (
  <Link
    to={to}
    className="inline-block px-6 py-3 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold transition-colors"
  >
    {children}
  </Link>
);

function AboutPage() {
  return (
    <Container>
      <section className="text-center mb-12">
        <Heading>About PetYupp</Heading>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          We believe every dog deserves natural, healthy products.
        </p>
      </section>
      <section>
        <Subheading>Our Story</Subheading>
        <p className="text-gray-700 leading-relaxed">
          PetYupp was founded to solve a simple problem: too many dog treats
          and chews on the shelf are packed with artificial ingredients, fillers,
          and chemicals that owners would never feed their own families. We
          started with a short list of single-ingredient chews sourced from
          trusted farms and have grown into a curated catalog matched to the
          specific things dogs actually need.
        </p>
      </section>
      <section>
        <Subheading>What We Stand For</Subheading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {[
            {
              title: 'Natural Ingredients',
              body:
                'Single-source, traceable, minimally processed. No artificial colors, flavors, or preservatives.',
            },
            {
              title: 'Problem-First Approach',
              body:
                'Every product maps to a real need — dental health, anxiety, joint support, or destructive chewing.',
            },
            {
              title: 'Vet Approved',
              body:
                'Our catalog is reviewed by practicing veterinarians so you can trust what you give your dog.',
            },
            {
              title: 'Made in USA',
              body:
                'Packed and shipped from our Novi, Michigan facility with free shipping on orders over $49.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-12">
        <Subheading>Our Mission</Subheading>
        <p className="text-gray-700 leading-relaxed">
          Happier dogs start here. We exist to help owners spend less time
          decoding labels and more time enjoying their dogs — with confidence
          that what they buy is safe, effective, and rooted in real nutrition.
        </p>
      </section>
      <section className="mt-12 text-center">
        <TealCTA to="/collections/all">Shop Our Products</TealCTA>
      </section>
    </Container>
  );
}

function ContactPage() {
  return (
    <Container>
      <Heading>Get in Touch</Heading>
      <p className="text-gray-600 mb-8">
        Questions, feedback, or just want to share a photo of your dog? We
        read every message.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <p className="font-semibold text-gray-900">Email</p>
            <a
              href="mailto:hello@petyupp.com"
              className="text-[#06B6D4] hover:text-[#0891B2] underline"
            >
              hello@petyupp.com
            </a>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Phone</p>
            <a
              href="tel:+12487334016"
              className="text-[#06B6D4] hover:text-[#0891B2]"
            >
              248-733-4016
            </a>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Address</p>
            <p className="not-italic">
              PetYupp Inc
              <br />
              28345 Beck Road, Suite 406
              <br />
              Novi, MI 48374
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Business Hours</p>
            <p>Mon–Fri, 9am–5pm EST</p>
          </div>
        </div>
        <form
          action="mailto:hello@petyupp.com"
          method="post"
          encType="text/plain"
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="contact-name"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Name
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="contact-email"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Email
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="contact-message"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-6 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold transition-colors"
          >
            Send Message
          </button>
        </form>
      </div>
    </Container>
  );
}

function ShippingPage() {
  return (
    <Container>
      <Heading>Shipping &amp; Delivery</Heading>
      <ul className="space-y-3 text-gray-700 list-disc pl-5">
        <li>
          Free standard shipping on US orders <strong>$49 and over</strong>.
        </li>
        <li>Standard shipping: 5–7 business days.</li>
        <li>Express shipping is available at checkout for faster delivery.</li>
        <li>We currently ship to the United States and Canada.</li>
        <li>Order tracking is provided by email once your order ships.</li>
      </ul>
      <p className="mt-8 text-sm text-gray-600">
        Questions about a specific order? Email{' '}
        <a
          href="mailto:hello@petyupp.com"
          className="text-[#06B6D4] hover:text-[#0891B2] underline"
        >
          hello@petyupp.com
        </a>
        .
      </p>
    </Container>
  );
}

function ReturnsPage() {
  return (
    <Container>
      <Heading>Returns &amp; Exchanges</Heading>
      <ul className="space-y-3 text-gray-700 list-disc pl-5">
        <li>
          We offer a <strong>30-day</strong> return policy from the date of
          delivery.
        </li>
        <li>Items must be unused and in their original packaging.</li>
        <li>
          Email{' '}
          <a
            href="mailto:hello@petyupp.com"
            className="text-[#06B6D4] hover:text-[#0891B2] underline"
          >
            hello@petyupp.com
          </a>{' '}
          to initiate a return — include your order number.
        </li>
        <li>
          Once we receive your return, refunds are processed within 5–7 business
          days to the original payment method.
        </li>
      </ul>
    </Container>
  );
}

const STATIC_PAGES = {
  about: {
    Component: AboutPage,
    title: 'About PetYupp',
    description:
      'Learn about PetYupp — natural, vet-approved dog products founded to replace artificial-ingredient treats.',
  },
  'about-us': {
    Component: AboutPage,
    title: 'About PetYupp',
    description:
      'Learn about PetYupp — natural, vet-approved dog products founded to replace artificial-ingredient treats.',
  },
  contact: {
    Component: ContactPage,
    title: 'Contact PetYupp',
    description:
      'Get in touch with the PetYupp team by email, phone, or contact form.',
  },
  'contact-us': {
    Component: ContactPage,
    title: 'Contact PetYupp',
    description:
      'Get in touch with the PetYupp team by email, phone, or contact form.',
  },
  shipping: {
    Component: ShippingPage,
    title: 'Shipping & Delivery',
    description:
      'PetYupp shipping policy — free US shipping on orders $49+, standard 5–7 business days, US & Canada only.',
  },
  'shipping-policy': {
    Component: ShippingPage,
    title: 'Shipping & Delivery',
    description:
      'PetYupp shipping policy — free US shipping on orders $49+, standard 5–7 business days, US & Canada only.',
  },
  returns: {
    Component: ReturnsPage,
    title: 'Returns & Exchanges',
    description:
      'PetYupp 30-day return policy. Items must be unused. Email hello@petyupp.com to initiate a return.',
  },
  'refund-policy': {
    Component: ReturnsPage,
    title: 'Returns & Exchanges',
    description:
      'PetYupp 30-day return policy. Items must be unused. Email hello@petyupp.com to initiate a return.',
  },
};

export function getStaticPage(handle) {
  if (!handle) return null;
  return STATIC_PAGES[handle.toLowerCase()] ?? null;
}
