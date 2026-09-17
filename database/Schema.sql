CREATE DATABASE cinema_booking;
USE cinema_booking;

CREATE TABLE IF NOT EXISTS `cinema_booking`.`Movie` (
  `movie_id` INT NOT NULL AUTO_INCREMENT,
  `poster` VARCHAR(500) NULL,
  `title` VARCHAR(255) NOT NULL,
  `rating` DECIMAL(3,1) NULL,
  `description` TEXT NULL,
  `genre` VARCHAR(100) NULL,
  `status` VARCHAR(50) NOT NULL,
  `trailer` VARCHAR(500) NULL,
  PRIMARY KEY (`movie_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cinema_booking`.`Location`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cinema_booking`.`Location` (
  `location_Id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(50) NULL,
  `zipcode` VARCHAR(10) NULL,
  PRIMARY KEY (`location_Id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cinema_booking`.`Showtime`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cinema_booking`.`Showtime` (
  `showtime` DATETIME NOT NULL,
  `movie_id` INT NOT NULL,
  `location_Id` INT NOT NULL,
  PRIMARY KEY (`showtime`, `movie_id`, `location_Id`),
  INDEX `fk_Showtime_Movie_idx` (`movie_id` ASC) VISIBLE,
  INDEX `fk_Showtime_Location1_idx` (`location_Id` ASC) VISIBLE,
  CONSTRAINT `fk_Showtime_Movie`
    FOREIGN KEY (`movie_id`)
    REFERENCES `cinema_booking`.`Movie` (`movie_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Showtime_Location1`
    FOREIGN KEY (`location_Id`)
    REFERENCES `cinema_booking`.`Location` (`location_Id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

-- ============================================================
-- MOVIES
-- ============================================================

INSERT INTO Movie
    (poster, title, rating, description, genre, status, trailer)
VALUES
    (
        'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        'Interstellar',
        8.7,
        'A team of explorers travels through a wormhole in space in an attempt to ensure humanity''s survival.',
        'Sci-Fi, Drama, Adventure',
        'Out Now',
        'https://www.youtube.com/watch?v=zSWdZVtXT7E'
    ),
    (
        'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        'The Dark Knight',
        9.0,
        'Batman faces a criminal mastermind who plunges Gotham City into chaos.',
        'Action, Crime, Drama',
        'Out Now',
        'https://www.youtube.com/watch?v=EXeTwQWrcwY'
    ),
    (
        'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        'Oppenheimer',
        8.3,
        'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.',
        'Drama, History',
        'Out Now',
        'https://www.youtube.com/watch?v=uYPbbksJxIg'
    ),
    (
        'https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
        'The Shawshank Redemption',
        9.3,
        'A banker sentenced to life in prison forms an unlikely friendship while maintaining hope for freedom.',
        'Drama',
        'Out Now',
        'https://www.youtube.com/watch?v=PLl99DlL6b4'
    ),
    (
        'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
        'Dune: Part Two',
        8.5,
        'Paul Atreides unites with Chani and the Fremen while seeking revenge against those who destroyed his family.',
        'Sci-Fi, Adventure, Drama',
        'Out Now',
        'https://www.youtube.com/watch?v=Way9Dexny3w'
    ),
    (
        'https://image.tmdb.org/t/p/w500/kMDUS7VmFhb2coRfVBoGLR8ADBt.jpg',
        'Spider-Man 2',
        7.5,
        'Peter Parker struggles to balance his personal life with his responsibilities as Spider-Man while facing Doctor Octopus.',
        'Action, Adventure, Sci-Fi',
        'Out Now',
        'https://www.youtube.com/watch?v=1s9Yln0YwCw'
    ),

    -- COMING SOON

    (
        NULL,
        'Avengers: Secret Wars',
        NULL,
        'The Avengers return for a new chapter in the Marvel Cinematic Universe.',
        'Action, Adventure, Sci-Fi',
        'Coming Soon',
        NULL
    ),
    (
        NULL,
        'The Batman Part II',
        NULL,
        'The next chapter in the story of Batman in Gotham City.',
        'Action, Crime, Drama',
        'Coming Soon',
        NULL
    ),
    (
        NULL,
        'Spider-Man: Beyond the Spider-Verse',
        NULL,
        'Miles Morales continues his journey across the Spider-Verse.',
        'Animation, Action, Adventure',
        'Coming Soon',
        NULL
    ),
    (
        NULL,
        'Frozen III',
        NULL,
        'The next animated adventure in the Frozen film series.',
        'Animation, Adventure, Family',
        'Coming Soon',
        NULL
    ),
    (
        NULL,
        'The Super Mario Galaxy Movie',
        NULL,
        'Mario and his friends return for a new animated adventure.',
        'Animation, Adventure, Comedy',
        'Coming Soon',
        NULL
    ),
    (
        NULL,
        'Star Wars: Starfighter',
        NULL,
        'A new standalone adventure set in the Star Wars galaxy.',
        'Sci-Fi, Adventure, Action',
        'Coming Soon',
        NULL
    );


-- ============================================================
-- LOCATIONS
-- ============================================================

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
    (showtime, movie_id, location_Id)
VALUES

    -- ========================================================
    -- INTERSTELLAR
    -- ========================================================

    ('2026-09-18 13:00:00', 1, 1),
    ('2026-09-18 17:00:00', 1, 1),
    ('2026-09-18 21:00:00', 1, 1),

    ('2026-09-18 14:30:00', 1, 2),
    ('2026-09-18 19:00:00', 1, 2),

    ('2026-09-18 18:00:00', 1, 3),


    -- ========================================================
    -- THE DARK KNIGHT
    -- ========================================================

    ('2026-09-18 14:00:00', 2, 1),
    ('2026-09-18 18:00:00', 2, 1),
    ('2026-09-18 21:30:00', 2, 1),

    ('2026-09-18 16:00:00', 2, 2),
    ('2026-09-18 20:00:00', 2, 2),

    ('2026-09-18 19:30:00', 2, 3),


    -- ========================================================
    -- OPPENHEIMER
    -- ========================================================

    ('2026-09-18 12:30:00', 3, 1),
    ('2026-09-18 16:30:00', 3, 1),
    ('2026-09-18 20:30:00', 3, 1),

    ('2026-09-18 15:30:00', 3, 2),
    ('2026-09-18 19:30:00', 3, 2),

    ('2026-09-18 17:30:00', 3, 3),


    -- ========================================================
    -- THE SHAWSHANK REDEMPTION
    -- ========================================================

    ('2026-09-18 13:30:00', 4, 1),
    ('2026-09-18 18:30:00', 4, 1),

    ('2026-09-18 14:00:00', 4, 2),
    ('2026-09-18 19:00:00', 4, 2),

    ('2026-09-18 20:00:00', 4, 3),


    -- ========================================================
    -- DUNE: PART TWO
    -- ========================================================

    ('2026-09-18 12:00:00', 5, 1),
    ('2026-09-18 16:00:00', 5, 1),
    ('2026-09-18 20:00:00', 5, 1),

    ('2026-09-18 13:00:00', 5, 2),
    ('2026-09-18 17:30:00', 5, 2),
    ('2026-09-18 21:30:00', 5, 2),

    ('2026-09-18 18:30:00', 5, 3),


    -- ========================================================
    -- SPIDER-MAN 2
    -- ========================================================

    ('2026-09-18 13:00:00', 6, 1),
    ('2026-09-18 16:00:00', 6, 1),
    ('2026-09-18 19:00:00', 6, 1),

    ('2026-09-18 14:30:00', 6, 2),
    ('2026-09-18 18:30:00', 6, 2),

    ('2026-09-18 20:30:00', 6, 3),


    -- ========================================================
    -- SEPTEMBER 19 ADDITIONAL SHOWTIMES
    -- ========================================================

    ('2026-09-19 14:00:00', 1, 1),
    ('2026-09-19 19:00:00', 1, 2),

    ('2026-09-19 15:00:00', 2, 1),
    ('2026-09-19 20:00:00', 2, 3),

    ('2026-09-19 16:00:00', 3, 1),
    ('2026-09-19 20:30:00', 3, 2),

    ('2026-09-19 17:00:00', 4, 1),

    ('2026-09-19 14:30:00', 5, 2),
    ('2026-09-19 19:30:00', 5, 3),

    ('2026-09-19 13:30:00', 6, 1),
    ('2026-09-19 18:00:00', 6, 2);
    