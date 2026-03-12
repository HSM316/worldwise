import styles from "./Product.module.css";
import PageNav from "../components/PageNav";

export default function Product() {
  return (
    <main className={styles.product}>
      <PageNav />
      <section>
        <img
          src="img-1.jpg"
          alt="person with dog overlooking mountain with sunset"
        />
        <div>
          <h2>About WorldWise.</h2>
          <p>
            Welcome to WorldWise, your personal travel companion for tracking and sharing your adventures around the globe. Whether you're a seasoned traveler or just starting to explore, WorldWise helps you document every destination, memory, and moment that matters.
          </p>
          <p>
            Our mission is to make travel tracking effortless and enjoyable. Mark the cities you've visited, add notes about your experiences, and build a visual map of your journey. Connect with fellow travelers, discover new destinations, and relive your favorite moments anytime, anywhere.
          </p>
        </div>
      </section>
    </main>
  );
}
