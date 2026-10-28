package com.mx.catalogservice.repository;

import com.mx.catalogservice.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryDao extends JpaRepository<Category, Long> {

    // Metodo para validar si existe una categoria con ese nombre
    boolean existsByName(String name);

    // Metodo para validar si existe una categoria con ese id
    List<Category> findByActiveTrue();


}
