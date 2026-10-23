package com.mx.catalogservice.repository;

import com.mx.catalogservice.entity.Products;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductsDao extends JpaRepository<Products, Long> {
}
