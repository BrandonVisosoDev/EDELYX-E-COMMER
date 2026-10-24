package com.mx.catalogservice.repository;

import com.mx.catalogservice.entity.Category;
import com.mx.catalogservice.entity.Products;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductsDao extends JpaRepository<Products, Long> {

    // Metodo para validar si existe una categoria con ese nombre
    boolean existsBySku(String sku);

    // Metodo para ver si pageable esta activo
    List<Products> findByActiveTrue();

    // Metodo para obtener solo los activos
    Optional<Products> findByIdAndActiveTrue(Long id);




}
