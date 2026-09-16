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
    ON UPDATE NO ACTION)