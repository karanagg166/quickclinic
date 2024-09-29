import React from 'react';
import { Carousel, Container, Row, Col, Button } from 'react-bootstrap';
import './home.css'; // Import custom CSS for additional styling 
import doc_main from '../../images/doc_main.jpg'
const HomePage = () => {
    return (
      <div className="homepage flex flex-col">
        {/* Hero Section */}
        <div className="hero-section d-flex align-items-center justify-content-center">
          <Container>
            <Row>
              <Col md={6} className="text-center text-md-left  ml-16">
                <h1 className="display-4 text-light animate-fade-in">Welcome to Doctor Quick Clinic</h1>
                <p className="text-light lead animate-slide-in mt-6">Your health, our priority. Join us today for a healthier tomorrow!</p>
                <Button variant="primary" size="lg" className="mt-6 animate-bounce">Get Started</Button>
              </Col>
              <Col>
              <img src={doc_main} className='bg-black rounded-3xl ml-6 shadow-lg shadow-cyan-500/50' alt="Hero Image"/>
              </Col>
            </Row>
          </Container>
        </div>
  
        {/* Slideshow Section */}
        <div className='flex justify-center align-items-center'>
          <Container className="mt-5 ml-36">
            <Carousel fade className="carousel-animated">
              <Carousel.Item>
                <img
                  className="d-block "
                  src="https://via.placeholder.com/1200x500?text=Quality+Healthcare"
                  alt="Quality Healthcare"
                />
                <Carousel.Caption>
                  <h3 className="animate-zoom-in">Quality Healthcare</h3>
                  <p className="animate-fade-in">We provide the best medical care in the city.</p>
                </Carousel.Caption>
              </Carousel.Item>
              <Carousel.Item>
                <img
                  className="d-block "
                  src="https://via.placeholder.com/1200x500?text=Experienced+Doctors"
                  alt="Experienced Doctors"
                />
                <Carousel.Caption>
                  <h3 className="animate-zoom-in">Experienced Doctors</h3>
                  <p className="animate-fade-in">Our team of doctors are highly skilled and experienced.</p>
                </Carousel.Caption>
              </Carousel.Item>
              <Carousel.Item>
                <img
                  className="d-block "
                  src="https://via.placeholder.com/1200x500?text=State-of-the-art+Facilities"
                  alt="State-of-the-art Facilities"
                />
                <Carousel.Caption>
                  <h3 className="animate-zoom-in">State-of-the-art Facilities</h3>
                  <p className="animate-fade-in">We use the latest technology to provide exceptional care.</p>
                </Carousel.Caption>
              </Carousel.Item>
            </Carousel>
          </Container>
        </div>
  
        {/* About Us Section */}
        <Container className="about-us mt-5">
          <Row>
            <Col md={6} className="animate-slide-up">
              <img src="https://via.placeholder.com/600x400" alt="Clinic" className="img-fluid rounded" />
            </Col>
            <Col md={6} className="d-flex flex-column justify-content-center animate-slide-up">
              <h2>About Doctor Quick Clinic</h2>
              <p>
                Doctor Quick Clinic is dedicated to providing comprehensive healthcare services. Our mission is to enhance
                the well-being of our community through compassionate care and the latest medical advancements.
              </p>
              <Button variant="outline-primary" size="lg" className="mt-3 animate-hover-grow">Learn More</Button>
            </Col>
          </Row>
        </Container>
      </div>
    );
  };
  
  export default HomePage;
