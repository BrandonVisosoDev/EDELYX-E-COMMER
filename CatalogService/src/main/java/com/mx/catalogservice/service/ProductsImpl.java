package com.mx.catalogservice.service;

// Le decimos que es un servicio

import com.mx.catalogservice.entity.Category;
import com.mx.catalogservice.entity.Products;
import com.mx.catalogservice.model.ProductRequest;
import com.mx.catalogservice.model.ProductResponse;
import com.mx.catalogservice.repository.CategoryDao;
import com.mx.catalogservice.repository.ProductsDao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductsImpl implements MetodosProducts {

    private final ProductsDao productsDao;
    private final CategoryDao categoryDao;

    // Inyectamos por constructor
    public ProductsImpl(ProductsDao productsDao, CategoryDao categoryDao) {
        this.productsDao = productsDao;
        this.categoryDao = categoryDao;
    }

    // Metodo Crear
    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request){

        // 1. VALIDAMOS QUE NO EXISTA UN PRODUCTO CON ESE NOMBRE
        if(productsDao.existsBySku(request.getSku())){
            throw new IllegalArgumentException("Ya existe un producto con el sku: " + request.getSku());
        }

        // 2. VALIDAMOS QUE LA CATEGORIA EXISTA
        Category categoriaAsignada = categoryDao.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("No existe la categoria con id: " + request.getCategoryId()));

        // 3. MAPEAMOS DE REQUEST A ENTITY
        Products nuevoProducto = new Products();
        nuevoProducto.setSku(request.getSku());
        nuevoProducto.setName(request.getName());
        nuevoProducto.setDescription(request.getDescription());
        nuevoProducto.setPrice(request.getPrice());
        nuevoProducto.setStock(request.getStock());
        nuevoProducto.setImageUrl(request.getImageUrl());
        nuevoProducto.setActive(true);
        nuevoProducto.setCreatedAt(java.time.LocalDateTime.now());

        // 4. GUARDAMOS LA RELACION
        nuevoProducto.setCategory(categoriaAsignada);

        // 5. PERSISTIMOS EL PRODUCTO EN LA BASE DE DATOS
        Products productoGuardado = productsDao.save(nuevoProducto);

        // 6. MAPEAMOS DE ENTITY A RESPONSE
        return ProductResponse.builder()
            .id(productoGuardado.getId())
            .sku(productoGuardado.getSku())
            .name(productoGuardado.getName())
            .description(productoGuardado.getDescription())
            .price(productoGuardado.getPrice())
            .stock(productoGuardado.getStock())
            .imageUrl(productoGuardado.getImageUrl())
            .categoryId(categoriaAsignada.getId())
            .categoryName(categoriaAsignada.getName()) // El frontend agradece mucho este dato
            .build();
    }

    // METODO READ
    @Override
    public Page<ProductResponse> listProducts(Pageable pageable){

        // 1. OBTENEMOS LA PAGINA DE ENTIDADES (SOLO ACTIVAS)
        Page<Products> paginaDeProductos = productsDao.findByActiveTrue(pageable);

        // 2. MAPEAMOS LA PAGINA DE ENTIDAD A PAGINA DE DTO
        return paginaDeProductos.map(producto -> ProductResponse.builder()
                .id(producto.getId())
                .sku(producto.getSku())
                .name(producto.getName())
                .description(producto.getDescription())
                .price(producto.getPrice())
                .stock(producto.getStock())
                .imageUrl(producto.getImageUrl())
                .categoryId(producto.getCategory().getId())
                .categoryName(producto.getCategory().getName()) // El frontend agradece mucho este dato
                .build());
    }

    // METODO READ BY ID
    @Override
    public ProductResponse getProductById(Long id){

        // 1. VALIDAMOS QUE EXISTA EL PRODUCTO CON ESE ID
        Products producto = productsDao.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe el producto con id: " + id));

        // 2. MAPEAMOS DE ENTITY A RESPONSE
        return ProductResponse.builder()
                .id(producto.getId())
                .sku(producto.getSku())
                .name(producto.getName())
                .description(producto.getDescription())
                .price(producto.getPrice())
                .stock(producto.getStock())
                .imageUrl(producto.getImageUrl())
                .categoryId(producto.getCategory().getId())
                .categoryName(producto.getCategory().getName()) // El frontend agradece mucho este dato
                .build();
    }

    // METODO UPDATE
    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request){

        // 1. VALIDAMOS QUE EXISTA EL PRODUCTO CON ESE ID
        Products productoExistente = productsDao.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe el producto con id: " + id));

        // 2. VALIDAMOS QUE NO EXISTA OTRO PRODUCTO CON ESE SKU
        if(productsDao.existsBySku(request.getSku()) && !productoExistente.getSku().equals(request.getSku())){
            throw new IllegalArgumentException("Ya existe un producto con el sku: " + request.getSku());
        }

        // 3. VALIDAMOS QUE LA CATEGORIA EXISTA
        Category categoriaAsignada = categoryDao.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("No existe la categoria con id: " + request.getCategoryId()));

        // 4. MAPEAMOS DE REQUEST A ENTITY
        productoExistente.setSku(request.getSku());
        productoExistente.setName(request.getName());
        productoExistente.setDescription(request.getDescription());
        productoExistente.setPrice(request.getPrice());
        productoExistente.setStock(request.getStock());
        productoExistente.setImageUrl(request.getImageUrl());
        productoExistente.setCategory(categoriaAsignada);

        // 5. PERSISTIMOS EL PRODUCTO EN LA BASE DE DATOS
        Products productoGuardado = productsDao.save(productoExistente);

        // 6. MAPEAMOS DE ENTITY A RESPONSE
        return ProductResponse.builder()
                .id(productoGuardado.getId())
                .sku(productoGuardado.getSku())
                .name(productoGuardado.getName())
                .description(productoGuardado.getDescription())
                .price(productoGuardado.getPrice())
                .stock(productoGuardado.getStock())
                .imageUrl(productoGuardado.getImageUrl())
                .categoryId(categoriaAsignada.getId())
                .categoryName(categoriaAsignada.getName()) // El frontend agradece mucho este dato
                .build();
    }

    @Override
    @Transactional
    public void deactivateProduct(Long id){

        // 1. VALIDAMOS QUE EXISTA EL PRODUCTO CON ESE ID
        Products productoExistente = productsDao.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe el producto con id: " + id));

        // 2. DESACTIVAMOS EL PRODUCTO
        productoExistente.setActive(false);

        // 3. PERSISTIMOS EL PRODUCTO EN LA BASE DE DATOS
        productsDao.save(productoExistente);
    }
}
