CREATE DATABASE cinema_booking;
USE cinema_booking;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`Movie` (
  `movie_id` INT NOT NULL AUTO_INCREMENT,
  `poster` VARCHAR(500) NULL,
  `title` VARCHAR(255) NOT NULL,
  `mpaa_rating` VARCHAR(10) NULL,
  `description` TEXT NULL,
  `genre` VARCHAR(100) NULL,
  `status` VARCHAR(50) NOT NULL,
  `trailer_image` VARCHAR(500) NULL,
  `trailer` VARCHAR(500) NULL,
  PRIMARY KEY (`movie_id`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`Person` (
	`person_id` INT NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`person_id`))
ENGINE = InnoDB;

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
)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cinema_booking`.`Location`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cinema_booking`.`Location` (
  `location_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(50) NULL,
  `zipcode` VARCHAR(10) NULL,
  PRIMARY KEY (`location_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cinema_booking`.`Showtime`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cinema_booking`.`Showtime` (
  `showtime` DATETIME NOT NULL,
  `movie_id` INT NOT NULL,
  `location_id` INT NOT NULL,
  PRIMARY KEY (`showtime`, `movie_id`, `location_id`),
  INDEX `fk_Showtime_Movie_idx` (`movie_id` ASC) VISIBLE,
  INDEX `fk_Showtime_Location1_idx` (`location_id` ASC) VISIBLE,
  CONSTRAINT `fk_Showtime_Movie`
    FOREIGN KEY (`movie_id`)
    REFERENCES `cinema_booking`.`Movie` (`movie_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Showtime_Location1`
    FOREIGN KEY (`location_id`)
    REFERENCES `cinema_booking`.`Location` (`location_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

INSERT INTO Movie
    (poster, title, mpaa_rating, description, genre, status, trailer_image, trailer)
VALUES
    (
        'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        'Interstellar',
        'PG-13',
        'A team of explorers travels through a wormhole in space in an attempt to ensure humanity''s survival.',
        'Sci-Fi, Drama, Adventure',
        'Out Now',
        'https://img.youtube.com/vi/zSWdZVtXT7E/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=zSWdZVtXT7E'
    ),
    (
        'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        'The Dark Knight',
        'PG-13',
        'Batman faces a criminal mastermind who plunges Gotham City into chaos.',
        'Action, Crime, Drama',
        'Out Now',
        'https://img.youtube.com/vi/EXeTwQWrcwY/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=EXeTwQWrcwY'
    ),
    (
        'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        'Oppenheimer',
        'R',
        'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.',
        'Drama, History',
        'Out Now',
        'https://img.youtube.com/vi/uYPbbksJxIg/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=uYPbbksJxIg'
    ),
    (
        'https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
        'The Shawshank Redemption',
        'R',
        'A banker sentenced to life in prison forms an unlikely friendship while maintaining hope for freedom.',
        'Drama',
        'Out Now',
        'https://img.youtube.com/vi/PLl99DlL6b4/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=PLl99DlL6b4'
    ),
    (
        'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
        'Dune: Part Two',
        'PG-13',
        'Paul Atreides unites with Chani and the Fremen while seeking revenge against those who destroyed his family.',
        'Sci-Fi, Adventure, Drama',
        'Out Now',
        'https://img.youtube.com/vi/Way9Dexny3w/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=Way9Dexny3w'
    ),
    (
        'https://image.tmdb.org/t/p/w500/kMDUS7VmFhb2coRfVBoGLR8ADBt.jpg',
        'Spider-Man 2',
        'PG-13',
        'Peter Parker struggles to balance his personal life with his responsibilities as Spider-Man while facing Doctor Octopus.',
        'Action, Adventure, Sci-Fi',
        'Out Now',
        'https://img.youtube.com/vi/1s9Yln0YwCw/maxresdefault.jpg',
        'https://www.youtube.com/watch?v=1s9Yln0YwCw'
    ),
    (
        NULL,
        'Avengers: Secret Wars',
        NULL,
        'The Avengers return for a new chapter in the Marvel Cinematic Universe.',
        'Action, Adventure, Sci-Fi',
        'Coming Soon',
        NULL,
        NULL
    ),
    (
        NULL,
        'The Batman Part II',
        NULL,
        'The next chapter in the story of Batman in Gotham City.',
        'Action, Crime, Drama',
        'Coming Soon',
        NULL,
        NULL
    ),
    (
        NULL,
        'Spider-Man: Beyond the Spider-Verse',
        NULL,
        'Miles Morales continues his journey across the Spider-Verse.',
        'Animation, Action, Adventure',
        'Coming Soon',
        NULL,
        NULL
    ),
    (
        NULL,
        'Frozen III',
        NULL,
        'The next animated adventure in the Frozen film series.',
        'Animation, Adventure, Family',
        'Coming Soon',
        NULL,
        NULL
    ),
    (
        NULL,
        'The Super Mario Galaxy Movie',
        NULL,
        'Mario and his friends return for a new animated adventure.',
        'Animation, Adventure, Comedy',
        'Coming Soon',
        NULL,
        NULL
    ),
    (
        NULL,
        'Star Wars: Starfighter',
        NULL,
        'A new standalone adventure set in the Star Wars galaxy.',
        'Sci-Fi, Adventure, Action',
        'Coming Soon',
        NULL,
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
    ('James', 'Franco');


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

    (7, 9, 'Director', NULL),
    (7, 10, 'Director', NULL),
    (7, 11, 'Producer', NULL),

    (8, 12, 'Director', NULL),

    (12, 13, 'Director', NULL);


INSERT INTO Location
    (name, address, city, state, zipcode)
VALUES
    (
        'Athens Cinema',
        '100 College Avenue',
        'Athens',
        'GA',
        '30601'
    ),
    (
        'Atlanta Cinema',
        '250 Peachtree Street',
        'Atlanta',
        'GA',
        '30303'
    ),
    (
        'Savannah Cinema',
        '75 River Street',
        'Savannah',
        'GA',
        '31401'
    );


INSERT INTO Showtime
    (showtime, movie_id, location_id)
VALUES
    ('2026-09-26 13:00:00', 1, 1),
    ('2026-09-26 17:00:00', 1, 1),
    ('2026-09-26 21:00:00', 1, 1),
    ('2026-09-26 14:30:00', 1, 2),
    ('2026-09-26 19:00:00', 1, 2),
    ('2026-09-26 18:00:00', 1, 3),

    ('2026-09-26 14:00:00', 2, 1),
    ('2026-09-26 18:00:00', 2, 1),
    ('2026-09-26 21:30:00', 2, 1),
    ('2026-09-26 16:00:00', 2, 2),
    ('2026-09-26 20:00:00', 2, 2),
    ('2026-09-26 19:30:00', 2, 3),

    ('2026-09-26 12:30:00', 3, 1),
    ('2026-09-26 16:30:00', 3, 1),
    ('2026-09-26 20:30:00', 3, 1),
    ('2026-09-26 15:30:00', 3, 2),
    ('2026-09-26 19:30:00', 3, 2),
    ('2026-09-26 17:30:00', 3, 3),

    ('2026-09-26 13:30:00', 4, 1),
    ('2026-09-26 18:30:00', 4, 1),
    ('2026-09-26 14:00:00', 4, 2),
    ('2026-09-26 19:00:00', 4, 2),
    ('2026-09-26 20:00:00', 4, 3),

    ('2026-09-26 12:00:00', 5, 1),
    ('2026-09-26 16:00:00', 5, 1),
    ('2026-09-26 20:00:00', 5, 1),
    ('2026-09-26 13:00:00', 5, 2),
    ('2026-09-26 17:30:00', 5, 2),
    ('2026-09-26 21:30:00', 5, 2),
    ('2026-09-26 18:30:00', 5, 3),

    ('2026-09-26 13:00:00', 6, 1),
    ('2026-09-26 16:00:00', 6, 1),
    ('2026-09-26 19:00:00', 6, 1),
    ('2026-09-26 14:30:00', 6, 2),
    ('2026-09-26 18:30:00', 6, 2),
    ('2026-09-26 20:30:00', 6, 3),

    ('2026-09-27 14:00:00', 1, 1),
    ('2026-09-27 19:00:00', 1, 2),

    ('2026-09-27 15:00:00', 2, 1),
    ('2026-09-27 20:00:00', 2, 3),

    ('2026-09-27 16:00:00', 3, 1),
    ('2026-09-27 20:30:00', 3, 2),

    ('2026-09-27 17:00:00', 4, 1),

    ('2026-09-27 14:30:00', 5, 2),
    ('2026-09-27 19:30:00', 5, 3),

    ('2026-09-27 13:30:00', 6, 1),
    ('2026-09-27 18:00:00', 6, 2);