import Header from "./header";
import Footer from "./footer";

export default function Layout({ children }) {
    return (
        <>
             <Header />
              <main>
                 <section>{children}</section>      
              </main>
             <Footer />
        </>
    );
}