
CREATE SCHEMA IF NOT EXISTS `cinema_booking`;
USE `cinema_booking`;


CREATE SCHEMA IF NOT EXISTS `cinema_booking`;
USE `cinema_booking`;

DROP TABLE IF EXISTS `Ticket`;
DROP TABLE IF EXISTS `ShowSeat`;
DROP TABLE IF EXISTS `FavoriteMovie`;
DROP TABLE IF EXISTS `Recommendation`;
DROP TABLE IF EXISTS `CreditCard`;
DROP TABLE IF EXISTS `Booking`;
DROP TABLE IF EXISTS `Promotion`;
DROP TABLE IF EXISTS `Admin`;
DROP TABLE IF EXISTS `Customer`;
DROP TABLE IF EXISTS `User`;
DROP TABLE IF EXISTS `Seat`;
DROP TABLE IF EXISTS `Showtime`;
DROP TABLE IF EXISTS `MovieRole`;
DROP TABLE IF EXISTS `TheaterHall`;
DROP TABLE IF EXISTS `Person`;
DROP TABLE IF EXISTS `Movie`;


CREATE TABLE IF NOT EXISTS `cinema_booking`.`Movie` (
    `movie_id` INT NOT NULL AUTO_INCREMENT,
    `poster` VARCHAR(500) NULL,
    `title` VARCHAR(255) NOT NULL,
    `mpaa_rating` VARCHAR(10) NULL,
    `synopsis` TEXT NULL,
    `genre` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `trailer_image` VARCHAR(500) NULL,
    `trailer` VARCHAR(500) NULL,
    `reviews` VARCHAR(500) NULL,
    PRIMARY KEY (`movie_id`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`Person` (
    `person_id` INT NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`person_id`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`MovieRole` (
    `movie_id` INT NOT NULL,
    `person_id` INT NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `character_name` VARCHAR(255) NULL,
    PRIMARY KEY (`movie_id`, `person_id`, `role`),
    FOREIGN KEY (`movie_id`)
        REFERENCES `cinema_booking`.`Movie` (`movie_id`),
    FOREIGN KEY (`person_id`)
        REFERENCES `cinema_booking`.`Person` (`person_id`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`TheaterHall` (
    `hall_id` INT NOT NULL AUTO_INCREMENT,
    `hall_number` INT NOT NULL,
    PRIMARY KEY (`hall_id`),
    UNIQUE (`hall_number`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`Showtime` (
    `showtime_id` INT NOT NULL AUTO_INCREMENT,
    `movie_id` INT NOT NULL,
    `hall_id` INT NOT NULL,
    `show_date` DATE NOT NULL,
    `show_time` VARCHAR(10) NOT NULL,
    PRIMARY KEY (`showtime_id`),
    UNIQUE (`hall_id`, `show_date`, `show_time`),
    FOREIGN KEY (`movie_id`)
        REFERENCES `cinema_booking`.`Movie` (`movie_id`),
    FOREIGN KEY (`hall_id`)
        REFERENCES `cinema_booking`.`TheaterHall` (`hall_id`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`Seat` (
    `seat_id` INT NOT NULL AUTO_INCREMENT,
    `seat_number` INT NOT NULL,
    `hall_id` INT NOT NULL,
    PRIMARY KEY (seat_id),
	UNIQUE (hall_id, seat_number),
    INDEX `fk_Seat_theaterhall1_idx` (`hall_id`),
    CONSTRAINT `fk_Seat_theaterhall1`
        FOREIGN KEY (`hall_id`)
        REFERENCES `cinema_booking`.`TheaterHall` (`hall_id`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`ShowSeat` (
    `show_seat_id` INT NOT NULL AUTO_INCREMENT,
    `status` VARCHAR(20) NOT NULL,
    `seat_id` INT NOT NULL,
    `showtime_id` INT NOT NULL,
    PRIMARY KEY (`show_seat_id`),
    INDEX `fk_seat_seat1_idx` (`seat_id`),
    INDEX `fk_showseat_showtime1_idx` (`showtime_id`),
    UNIQUE (`showtime_id`, `seat_id`),
    CONSTRAINT `fk_seat_seat1`
        FOREIGN KEY (`seat_id`)
        REFERENCES `cinema_booking`.`Seat` (`seat_id`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
    CONSTRAINT `fk_showseat_showtime1`
        FOREIGN KEY (`showtime_id`)
        REFERENCES `cinema_booking`.`Showtime` (`showtime_id`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`User` (
    `user_id` INT NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(500) NOT NULL,
    `last_name` VARCHAR(500) NOT NULL,
    `email` VARCHAR(500) NOT NULL,
    `password` VARCHAR(300) NOT NULL,
    PRIMARY KEY (`user_id`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`Customer` (
    `mailing_address` VARCHAR(200) NOT NULL,
    `customer_id` INT NOT NULL,
    `status` ENUM(
        'Active',
        'Inactive',
        'Suspended'
    ) NOT NULL DEFAULT 'Active',
    PRIMARY KEY (`customer_id`),
    CONSTRAINT `fk_customer_user1`
        FOREIGN KEY (`customer_id`)
        REFERENCES `cinema_booking`.`User` (`user_id`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`Admin` (
    `admin_id` INT NOT NULL,
    PRIMARY KEY (`admin_id`),
    CONSTRAINT `fk_admin_user1`
        FOREIGN KEY (`admin_id`)
        REFERENCES `cinema_booking`.`User` (`user_id`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`Promotion` (
    `promo_code` VARCHAR(20) NOT NULL,
    `discount` DOUBLE NOT NULL,
    `valid` TINYINT NOT NULL,
    PRIMARY KEY (`promo_code`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`Booking` (
    `booking_Id` INT NOT NULL AUTO_INCREMENT,
    `total` DECIMAL(10,2) NOT NULL,
    `customer_id` INT NOT NULL,
    `promo_code` VARCHAR(20) NULL,
    PRIMARY KEY (`booking_Id`),
    INDEX `fk_booking_customer1_idx` (`customer_id`),
    INDEX `fk_booking_promotion1_idx` (`promo_code`),
    CONSTRAINT `fk_booking_customer1`
        FOREIGN KEY (`customer_id`)
        REFERENCES `cinema_booking`.`Customer` (`customer_id`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
    CONSTRAINT `fk_booking_promotion1`
        FOREIGN KEY (`promo_code`)
        REFERENCES `cinema_booking`.`Promotion` (`promo_code`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`Ticket` (
    `ticket_id` INT NOT NULL AUTO_INCREMENT,
    `show_seat_id` INT NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `booking_Id` INT NOT NULL,
    `ticket_type` ENUM(
        'Adult',
        'Child',
        'Senior'
    ) NOT NULL,
    PRIMARY KEY (`ticket_id`),
    INDEX `fk_Ticket_showseat1_idx` (`show_seat_id`),
    INDEX `fk_Ticket_booking1_idx` (`booking_Id`),
    CONSTRAINT `fk_Ticket_showseat1`
        FOREIGN KEY (`show_seat_id`)
        REFERENCES `cinema_booking`.`ShowSeat` (`show_seat_id`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
    CONSTRAINT `fk_Ticket_booking1`
        FOREIGN KEY (`booking_Id`)
        REFERENCES `cinema_booking`.`Booking` (`booking_Id`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`FavoriteMovie` (
    `movie_rank` INT NOT NULL,
    `customer_id` INT NOT NULL,
    `movie_id` INT NOT NULL,
    PRIMARY KEY (`customer_id`, `movie_id`),
    INDEX `fk_favoritemovie_movie1_idx` (`movie_id`),
    CONSTRAINT `fk_favoritemovie_customer1`
        FOREIGN KEY (`customer_id`)
        REFERENCES `cinema_booking`.`Customer` (`customer_id`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
    CONSTRAINT `fk_favoritemovie_movie1`
        FOREIGN KEY (`movie_id`)
        REFERENCES `cinema_booking`.`Movie` (`movie_id`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`Recommendation` (
    `preferences` JSON NULL,
    `customer_id` INT NOT NULL,
    `movie_id` INT NOT NULL,
    PRIMARY KEY (`customer_id`, `movie_id`),
    CONSTRAINT `fk_recommendation_customer1`
        FOREIGN KEY (`customer_id`)
        REFERENCES `cinema_booking`.`Customer` (`customer_id`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
    CONSTRAINT `fk_recommendation_movie1`
        FOREIGN KEY (`movie_id`)
        REFERENCES `cinema_booking`.`Movie` (`movie_id`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`CreditCard` (
    `customer_id` INT NOT NULL,
    `card_number` INT NOT NULL,
    `billing_address` VARCHAR(200) NOT NULL,
    `expiration_date` DATE NOT NULL,
    PRIMARY KEY (`card_number`),
    CONSTRAINT `fk_creditcard_customer1`
        FOREIGN KEY (`customer_id`)
        REFERENCES `cinema_booking`.`Customer` (`customer_id`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
) ENGINE = InnoDB;


INSERT INTO Movie
    (poster, title, mpaa_rating, synopsis, genre, status,
     trailer_image, trailer, reviews)
VALUES
    (
        'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        'Interstellar',
        'PG-13',
        'A team of explorers travels through a wormhole in space in an attempt to ensure humanity''s survival.',
        'Sci-Fi, Drama, Adventure',
        'Currently Running',
        'https://img.youtube.com/vi/zSWdZVtXT7E/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=zSWdZVtXT7E',
        'https://www.rottentomatoes.com/m/interstellar_2014#critics-reviews'
    ),
    (
        'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        'The Dark Knight',
        'PG-13',
        'Batman faces a criminal mastermind who plunges Gotham City into chaos.',
        'Action, Crime, Drama',
        'Currently Running',
        'https://img.youtube.com/vi/EXeTwQWrcwY/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=EXeTwQWrcwY',
        'https://www.rottentomatoes.com/m/the_dark_knight#critics-reviews'
    ),
    (
        'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        'Oppenheimer',
        'R',
        'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.',
        'Drama, History',
        'Currently Running',
        'https://img.youtube.com/vi/uYPbbksJxIg/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=uYPbbksJxIg',
        'https://www.rottentomatoes.com/m/oppenheimer_2023#critics-reviews'
    ),
    (
        'https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
        'The Shawshank Redemption',
        'R',
        'A banker sentenced to life in prison forms an unlikely friendship while maintaining hope for freedom.',
        'Drama',
        'Currently Running',
        'https://img.youtube.com/vi/PLl99DlL6b4/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=PLl99DlL6b4',
        'https://www.rottentomatoes.com/m/shawshank_redemption#critics-reviews'
    ),
    (
        'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
        'Dune: Part Two',
        'PG-13',
        'Paul Atreides unites with Chani and the Fremen while seeking revenge against those who destroyed his family.',
        'Sci-Fi, Adventure, Drama',
        'Currently Running',
        'https://img.youtube.com/vi/Way9Dexny3w/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=Way9Dexny3w',
        'https://www.rottentomatoes.com/m/dune_part_two#critics-reviews'
    ),
    (
        'https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p34442_p_v10_aq.jpg',
        'Spider-Man 2',
        'PG-13',
        'Peter Parker struggles to balance his personal life with his responsibilities as Spider-Man while facing Doctor Octopus.',
        'Action, Adventure, Sci-Fi',
        'Currently Running',
        'https://img.youtube.com/vi/1s9Yln0YwCw/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=1s9Yln0YwCw',
        'https://www.rottentomatoes.com/m/spiderman_2#critics-reviews'
    ),

    -- Coming Soon

    (
        'https://resizing.flixster.com/L4FFhrg4cS3UwcUFr9sHyEE_nlY=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzL2EzMDNkYmUyLTk4NzMtNDRkMS04Mjc4LWQ3NGU1MjNjMGQzMi5qcGc=',
        'Clayface',
        'R',
        'Matt Hagen''s rise from Gotham street kid to Hollywood leading man is cut short when he is horribly disfigured. A cutting-edge treatment restores his appearance but unexpectedly affects his grip on reality.',
        'Horror, Thriller',
        'Coming Soon',
        'https://img.youtube.com/vi/OGO4Mqvo3jI/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=OGO4Mqvo3jI',
        NULL
    ),
    (
        'https://resizing.flixster.com/HI64aC1g5q3IEbUvYxwC7aD2k8E=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzLzBmZTYzOGEwLTRjMTQtNDcxYS1hMzY3LTUwOTI5OGQ1OTI0Ny5qcGc=',
        'Street Fighter',
        NULL,
        'Estranged fighters Ryu and Ken Masters are thrown back into combat when Chun-Li recruits them for the World Warrior Tournament, where a deadly conspiracy awaits.',
        'Action, Adventure',
        'Coming Soon',
		'https://img.youtube.com/vi/Xt4X4FvXk2A/maxresdefault.jpg',
	    'https://www.youtube.com/watch?v=Xt4X4FvXk2A',
        NULL
    ),
    (
        'https://resizing.flixster.com/dKU6Pe1P3KPx74Z_y3aX98rn4T4=/fit-in/352x330/v2/https://resizing.flixster.com/1t7u88QXOet-KAWbng7yel34DjY=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzLzZlODBlNGU2LWIxN2YtNGNiMC04ZGE0LWFjZDFmNTI5YTVmNC5qcGc=',
        'The Hunger Games: Sunrise on the Reaping',
        NULL,
        'Twenty-four years before the events of The Hunger Games, a young Haymitch Abernathy is selected to compete in the 50th Hunger Games, also known as the Second Quarter Quell.',
        'Action, Adventure, Drama',
        'Coming Soon',
        'https://img.youtube.com/vi/fS35YSjopjE/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=fS35YSjopjE',
        NULL
    ),
    (
        'https://m.media-amazon.com/images/M/MV5BNGEwYWZkN2UtOTQ5Mi00MGQzLWEzNjYtMWMyNDBkMTkzMWNkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
        'Avengers: Doomsday',
        NULL,
        'Heroes from three distinct universes are set on a deadly collision course as they face an existential threat unlike anything they have encountered before.',
        'Action, Adventure, Sci-Fi',
        'Coming Soon',
        'https://img.youtube.com/vi/fxNh27fRdYA/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=fxNh27fRdYA',
        NULL
    ),
    (
        'https://resizing.flixster.com/_iIt4XxdnDsIgXQ3I2U-x0Xj_70=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzL2VkN2QzNWJhLTcyMzgtNDlkMS05NDZkLWJiZjE4ZGViZjNhNC5qcGc=',
        'Dune: Part Three',
        NULL,
        'Nearly two decades after Paul Atreides seized control of the Imperium, he must face the consequences of his reign as old allies return, new threats emerge, and betrayal lurks in every shadow.',
        'Sci-Fi, Adventure, Drama',
        'Coming Soon',
        'https://img.youtube.com/vi/iEpdGDM6x48/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=iEpdGDM6x48',
        NULL
    ),
    (
        'https://resizing.flixster.com/bI1UsSOuibnXKuyDqGX6-eOpxps=/fit-in/352x330/v2/https://resizing.flixster.com/2uORLUCFbTg2oV26tr-C4oevoC0=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzLzFmYWEyMGNmLWJkMGUtNGNjNC1hNzIzLTc5ODc4M2JlMDEzYS5qcGc=',
        'The Angry Birds Movie 3',
        NULL,
        'Red faces his greatest challenge yet as he attempts to survive fatherhood while once again saving the world.',
        'Animation, Adventure, Comedy',
        'Coming Soon',
        'https://img.youtube.com/vi/n1DBDfavlQo/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=n1DBDfavlQo',
        NULL
    );




INSERT INTO Person
    (first_name, last_name)
VALUES
    
    ('Christopher', 'Nolan'),       
    ('Emma', 'Thomas'),             
    ('Frank', 'Darabont'),          
    ('Niki', 'Marvin'),             
    ('Denis', 'Villeneuve'),        
    ('Mary', 'Parent'),             
    ('Sam', 'Raimi'),               
    ('Laura', 'Ziskin'),            
    ('Anthony', 'Russo'),           
    ('Joe', 'Russo'),               
    ('Kevin', 'Feige'),             
    ('Matt', 'Reeves'),             
    ('Shawn', 'Levy'),              

    ('Matthew', 'McConaughey'),     
    ('Anne', 'Hathaway'),           
    ('Jessica', 'Chastain'),        
    ('Michael', 'Caine'),           
    ('Christian', 'Bale'),          
    ('Heath', 'Ledger'),            
    ('Aaron', 'Eckhart'),           
    ('Gary', 'Oldman'),             
    ('Cillian', 'Murphy'),          
    ('Emily', 'Blunt'),             
    ('Robert', 'Downey Jr.'),       
    ('Matt', 'Damon'),              
    ('Tim', 'Robbins'),             
    ('Morgan', 'Freeman'),          
    ('Bob', 'Gunton'),              
    ('William', 'Sadler'),          
    ('Timothee', 'Chalamet'),       
    ('Zendaya', 'Coleman'),         
    ('Rebecca', 'Ferguson'),        
    ('Javier', 'Bardem'),           
    ('Tobey', 'Maguire'),           
    ('Kirsten', 'Dunst'),           
    ('Alfred', 'Molina'),           
    ('James', 'Franco'),            

    ('James', 'Watkins'),            
    ('Kitao', 'Sakurai'),            
    ('Francis', 'Lawrence'),         
    ('John', 'Rice');                



INSERT INTO MovieRole
    (movie_id, person_id, role, character_name)
VALUES
    
    (1, 1, 'Director', NULL),
    (1, 2, 'Producer', NULL),
    (1, 14, 'Actor', 'Cooper'),
    (1, 15, 'Actor', 'Brand'),
    (1, 16, 'Actor', 'Murph'),
    (1, 17, 'Actor', 'Professor Brand'),

    
    (2, 1, 'Director', NULL),
    (2, 2, 'Producer', NULL),
    (2, 18, 'Actor', 'Bruce Wayne / Batman'),
    (2, 19, 'Actor', 'Joker'),
    (2, 20, 'Actor', 'Harvey Dent'),
    (2, 21, 'Actor', 'James Gordon'),

    
    (3, 1, 'Director', NULL),
    (3, 2, 'Producer', NULL),
    (3, 22, 'Actor', 'J. Robert Oppenheimer'),
    (3, 23, 'Actor', 'Kitty Oppenheimer'),
    (3, 24, 'Actor', 'Lewis Strauss'),
    (3, 25, 'Actor', 'Leslie Groves'),

    
    (4, 3, 'Director', NULL),
    (4, 4, 'Producer', NULL),
    (4, 26, 'Actor', 'Andy Dufresne'),
    (4, 27, 'Actor', 'Ellis Boyd Redding'),
    (4, 28, 'Actor', 'Warden Norton'),
    (4, 29, 'Actor', 'Heywood'),

    
    (5, 5, 'Director', NULL),
    (5, 6, 'Producer', NULL),
    (5, 30, 'Actor', 'Paul Atreides'),
    (5, 31, 'Actor', 'Chani'),
    (5, 32, 'Actor', 'Lady Jessica'),
    (5, 33, 'Actor', 'Stilgar'),

    
    (6, 7, 'Director', NULL),
    (6, 8, 'Producer', NULL),
    (6, 34, 'Actor', 'Peter Parker / Spider-Man'),
    (6, 35, 'Actor', 'Mary Jane Watson'),
    (6, 36, 'Actor', 'Otto Octavius / Doctor Octopus'),
    (6, 37, 'Actor', 'Harry Osborn'),

    
    (7, 38, 'Director', NULL),

    (8, 39, 'Director', NULL),

    (9, 40, 'Director', NULL),

    (10, 9, 'Director', NULL),
    (10, 10, 'Director', NULL),
    (10, 11, 'Producer', NULL),

    (11, 5, 'Director', NULL),

    
    (12, 41, 'Director', NULL);



INSERT INTO TheaterHall
    (hall_number)
VALUES
    (1),
    (2),
    (3);




INSERT INTO Showtime
    (movie_id, hall_id, show_date, show_time)
VALUES

 
    (1, 1, '2026-09-26', '1:00 PM'),
    (1, 1, '2026-09-26', '5:00 PM'),
    (1, 1, '2026-09-26', '9:00 PM'),
    (1, 2, '2026-09-26', '2:30 PM'),
    (1, 2, '2026-09-26', '7:00 PM'),
    (1, 3, '2026-09-26', '6:00 PM'),

  
    (2, 1, '2026-09-26', '2:00 PM'),
    (2, 1, '2026-09-26', '6:00 PM'),
    (2, 1, '2026-09-26', '9:30 PM'),
    (2, 2, '2026-09-26', '4:00 PM'),
    (2, 2, '2026-09-26', '8:00 PM'),
    (2, 3, '2026-09-26', '7:30 PM'),

    
    (3, 1, '2026-09-26', '12:30 PM'),
    (3, 1, '2026-09-26', '4:30 PM'),
    (3, 1, '2026-09-26', '8:30 PM'),
    (3, 2, '2026-09-26', '3:30 PM'),
    (3, 2, '2026-09-26', '7:30 PM'),
    (3, 3, '2026-09-26', '5:30 PM'),

    
    (4, 1, '2026-09-26', '1:30 PM'),
    (4, 1, '2026-09-26', '6:30 PM'),
    (4, 2, '2026-09-26', '2:00 PM'),
    (4, 2, '2026-09-26', '6:00 PM'),
    (4, 3, '2026-09-26', '8:00 PM'),

    
    (5, 1, '2026-09-26', '12:00 PM'),
    (5, 1, '2026-09-26', '4:00 PM'),
    (5, 1, '2026-09-26', '8:00 PM'),
    (5, 2, '2026-09-26', '1:00 PM'),
    (5, 2, '2026-09-26', '5:30 PM'),
    (5, 2, '2026-09-26', '9:30 PM'),
    (5, 3, '2026-09-26', '6:30 PM'),

    
    (6, 1, '2026-09-26', '3:00 PM'),
    (6, 1, '2026-09-26', '7:00 PM'),
    (6, 1, '2026-09-26', '10:00 PM'),
    (6, 2, '2026-09-26', '3:00 PM'),
    (6, 2, '2026-09-26', '6:30 PM'),
    (6, 3, '2026-09-26', '8:30 PM'),

    

    
    (1, 1, '2026-09-27', '2:00 PM'),
    (1, 2, '2026-09-27', '7:00 PM'),

    
    (2, 1, '2026-09-27', '3:00 PM'),
    (2, 3, '2026-09-27', '8:00 PM'),


    (3, 1, '2026-09-27', '4:00 PM'),
    (3, 2, '2026-09-27', '8:30 PM'),

    
    (4, 1, '2026-09-27', '5:00 PM'),

    
    (5, 2, '2026-09-27', '2:30 PM'),
    (5, 3, '2026-09-27', '7:30 PM'),

    
    (6, 1, '2026-09-27', '1:30 PM'),
    (6, 2, '2026-09-27', '6:00 PM');